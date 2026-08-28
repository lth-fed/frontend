import {
	beginLogin,
	configureAuth,
	finishLogin,
	getAuthState,
	logout,
	getAccessToken,
	getStoredAccessToken,
	useExternalValidationAccount
} from 'auth-lib';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';
import { cachedMe, majorityGuild, themeGuild } from '$lib/api/user';
import { navigationSettled, replaceNavigation } from '$lib/navigation/stackNavigation';
import { invalidateAll } from '$app/navigation';
import Routes from '$lib/navigation/routes';
import { InAppBrowser } from '@capgo/capacitor-inappbrowser';
import { Capacitor } from '@capacitor/core';
import { clearCache } from '$lib/api/cache';
import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
import '$lib/state/locale.svelte';
import { startPushRegistrationRefresh } from '$lib/api/push';

/** Which fed-auth provider to log in with. LU (SAML behind OIDC) in
 *  production per krav §2–3; the passwordless test provider in dev. */
const AUTH_PROVIDER = dev ? ('test' as const) : ('lu' as const);
const AUTH_ORIGIN = dev ? 'http://localhost:8001' : 'https://api.auth.teknologappen.se';
const NATIVE_CONTINUE = 'tappen://oauth_callback';
/** URL fed-auth POSTs the signed JWT to during the token exchange. fed-auth
 *  translates the localhost development URL to the Compose service name when
 *  it starts with DEBUG=1. */
const BACKEND_CALLBACK_V1 =
	import.meta.env.VITE_BACKEND_CALLBACK_URL ??
	(dev
		? 'http://localhost:8000/v0/user/auth-callback/v1'
		: 'https://api.teknologappen.se/v0/user/auth-callback/v1');

configureAuth({ origin: AUTH_ORIGIN });

let authenticationGeneration = 0;

/** Prevent a delayed bootstrap or code exchange from restoring a session after logout. */
export function cancelPendingAuthentication(): void {
	authenticationGeneration += 1;
	session.isProcessing = false;
}

/**
 * Set the freshly-minted access token on `session` and resolve the
 * user-derived view of session state — guild context plus the visual
 * theme (neutral for direct members of multiple guilds). Wrapped
 * so the three sign-in entry points (bootstrap restore, native finish,
 * web callback) stay consistent without copy-pasted logic.
 */
async function activateSession(token: string, generation: number): Promise<void> {
	if (generation !== authenticationGeneration) return;
	session.accessToken = token;
	try {
		// Through the cache: the identity fetched here is the same one
		// Home's load reads a moment later.
		const me = await cachedMe();
		if (generation !== authenticationGeneration) return;
		const preferred = me.language.toLowerCase().split('-')[0];
		if (locales.some((locale) => locale === preferred) && preferred !== getLocale()) {
			await setLocale(preferred as (typeof locales)[number], { reload: false });
			document.documentElement.lang = preferred;
			// API mappings flatten i18n records using the active locale, so stale values cannot safely
			// survive a language change. Let the shell's own navigation (root → Home at cold start)
			// land first: an `invalidateAll` while it is pending would drop it (see `navigationSettled`).
			await navigationSettled();
			clearCache();
			await invalidateAll();
		}
		session.userId = me.id;
		session.guild = majorityGuild(me.groups) ?? null;
		session.themeGuild = themeGuild(me.groups) ?? null;
		startPushRegistrationRefresh();
	} catch (err) {
		console.error('Failed to derive session state from /user', err);
	}
}

export async function bootstrapAuth(): Promise<boolean> {
	const generation = authenticationGeneration;
	try {
		const state = await getAuthState();
		if (state === 'authenticated') {
			const stored = await getStoredAccessToken();
			if (stored) {
				// Render the app immediately with the locally stored session — `session.accessToken`
				// is only ever a gate, every request re-derives its own fresh token via
				// `authenticatedFetch`. Validate (refreshing if needed) in the background and only
				// kick back to sign-in if that genuinely fails; see `validateStoredSession`.
				session.accessToken = stored;
				void validateStoredSession(generation);
				return true;
			}
			// No token was ever stored despite an "authenticated" record — nothing to show
			// optimistically, fall back to waiting for a real one.
			// Reuses the stored access token while it's still fresh. Refreshing
			// unconditionally here spent a single-use refresh token on every page
			// load, so any navigation landing mid-rotation logged the user out.
			const token = await getAccessToken();
			if (token) {
				if (generation !== authenticationGeneration) return true;
				void activateSession(token, generation);
				return true;
			}
			// A definitively rejected refresh changes auth state to unauthenticated and should show the
			// normal login screen. A transport failure preserves it and gets the retry error screen.
			return (await getAuthState()) !== 'authenticated';
		} else if (state === 'authenticating') {
			// A previous login never came back (e.g. the SAML flow stranded on
			// an error page and the user navigated away). The server-side auth
			// session has a 30-minute TTL, so a pending state found at boot is
			// stale — reset so Landing offers a fresh attempt.
			await logout();
		}
		return true;
	} catch (err) {
		console.error('Auth bootstrap failed', err);
		return false;
	}
}

/**
 * Confirms the optimistically-restored session from the background: refreshes the
 * access token if it's no longer fresh, then activates the session as usual. Only a
 * definitively rejected refresh (auth state flips to unauthenticated) is a genuine
 * auth failure and kicks the user back to sign-in; a transport failure leaves the
 * optimistic session in place for the next request to retry.
 */
async function validateStoredSession(generation: number): Promise<void> {
	const token = await getAccessToken();
	if (generation !== authenticationGeneration) return;
	if (token) {
		void activateSession(token, generation);
		return;
	}
	if ((await getAuthState()) === 'authenticated') return;
	await logout();
	session.accessToken = null;
	session.userId = null;
	session.guild = null;
	session.themeGuild = null;
	clearCache();
}

/**
 * Kick off the SSO login flow. On native we use a secure in-app browser with a
 * custom-scheme callback. On web we top-level redirect to the auth server and
 * land back on /auth/callback, which finishes the flow.
 */
export async function startLogin(): Promise<void> {
	session.loginError = null;
	try {
		if (Capacitor.isNativePlatform()) {
			await startNativeLogin();
		} else {
			await startWebLogin();
		}
	} catch (err) {
		console.error('Login failed to start', err);
		session.loginError = 'failed';
	}
}

/** Enter the shared, non-admin account used by external app validators. */
export async function startExternalValidationLogin(): Promise<void> {
	const generation = authenticationGeneration;
	session.loginError = null;
	session.isProcessing = true;
	try {
		clearCache();
		const token = await useExternalValidationAccount();
		await activateSession(token, generation);
		if (generation !== authenticationGeneration) return;
		await replaceNavigation(Routes.Home, { resetDepth: true });
	} catch (err) {
		console.error('External validation login failed', err);
		await logout();
		session.accessToken = null;
		session.userId = null;
		session.guild = null;
		session.themeGuild = null;
		session.loginError = 'failed';
	} finally {
		session.isProcessing = false;
	}
}

async function startNativeLogin(): Promise<void> {
	const generation = authenticationGeneration;
	const redirect = await beginLogin(AUTH_PROVIDER, NATIVE_CONTINUE, BACKEND_CALLBACK_V1);
	if (typeof redirect !== 'string') {
		session.loginError = 'failed';
		return;
	}

	session.isProcessing = true;
	try {
		let response;
		try {
			response = await InAppBrowser.openSecureWindow({
				authEndpoint: redirect,
				redirectUri: NATIVE_CONTINUE,
				prefersEphemeralWebBrowserSession: true
			});
		} catch (_e) {
			// The user closed the in-app browser without completing the flow
			// (or the SAML leg stranded on an error page and they backed out).
			session.loginError = 'cancelled';
			return;
		}

		// The in-app browser lands on tappen://oauth_callback?code=…&state=…;
		// exchange the code for tokens (PKCE) — no cookies involved anymore.
		const token = await finishLogin(response.redirectedUri);
		if (token) {
			await activateSession(token, generation);
			if (generation !== authenticationGeneration) return;
			// Token is now in Preferences + session; safe to land on the
			// authenticated home and let its load fire API calls.
			await replaceNavigation(Routes.Home, { resetDepth: true });
		} else {
			// `?error=…` on the callback, state mismatch, or a failed exchange.
			session.loginError = 'failed';
		}
	} finally {
		session.isProcessing = false;
	}
}

async function startWebLogin(): Promise<void> {
	const continueUrl = `${window.location.origin}/auth/callback/`;
	const redirect = await beginLogin(AUTH_PROVIDER, continueUrl, BACKEND_CALLBACK_V1);
	if (typeof redirect !== 'string') {
		session.loginError = 'failed';
		return;
	}

	session.isProcessing = true;
	// eslint-disable-next-line no-restricted-syntax -- leaving the SPA for the external OIDC provider
	window.location.href = redirect;
}

/**
 * Finish the web SSO flow. The auth server redirected back here with
 * `?code=…&state=…`; exchange the code for tokens. Called from
 * /auth/callback. Returns whether a session was established.
 */
export async function finishWebLogin(): Promise<boolean> {
	const generation = authenticationGeneration;
	session.isProcessing = true;
	try {
		// eslint-disable-next-line no-restricted-syntax -- auth-lib needs the complete external callback URL
		const token = await finishLogin(window.location.href);
		if (token) {
			if (generation !== authenticationGeneration) return false;
			// The token has already been persisted. Do not keep the callback route waiting for the
			// secondary profile/theme request; it can finish while the authenticated app mounts.
			void activateSession(token, generation);
			return true;
		}
		session.loginError = 'failed';
		return false;
	} finally {
		session.isProcessing = false;
	}
}
