import {
	beginLogin,
	configureAuth,
	finishLogin,
	getAuthState,
	logout,
	refreshAccessToken
} from 'auth-lib';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';
import { cachedMe, majorityGuild } from '$lib/api/user';
import { replaceNavigation } from '$lib/navigation/stackNavigation';
import Routes from '$lib/navigation/routes';
import { InAppBrowser } from '@capgo/inappbrowser';
import { Capacitor } from '@capacitor/core';

const AUTH_ORIGIN = dev ? 'http://localhost:8001' : 'https://auth.teknologappen.se';
/** Which fed-auth provider to log in with. LU (SAML behind OIDC) in
 *  production per krav §2–3; the passwordless test provider in dev. */
const AUTH_PROVIDER = dev ? ('test' as const) : ('lu' as const);
const NATIVE_CONTINUE = 'tappen://oauth_callback';
/** URL fed-auth POSTs the signed JWT to so the backend can upsert the
 *  user record during the token exchange. Both dev localhost pairs and
 *  the prod domain are in fed-auth's allowlist. Server-to-server,
 *  never reaches the browser as a navigation. */
const BACKEND_CALLBACK_V1 = dev
	? 'http://localhost:8000/v0/user/auth-callback/v1'
	: 'https://api.teknologappen.se/v0/user/auth-callback/v1';

configureAuth({ origin: AUTH_ORIGIN });

/**
 * Set the freshly-minted access token on `session` and resolve the
 * user-derived view of session state — currently the active theming
 * guild (majority vote across the user's group memberships). Wrapped
 * so the three sign-in entry points (bootstrap restore, native finish,
 * web callback) stay consistent without copy-pasted logic.
 */
async function activateSession(token: string): Promise<void> {
	session.accessToken = token;
	try {
		// Through the cache: the identity fetched here is the same one
		// Home's load reads a moment later.
		const me = await cachedMe();
		session.userId = me.id;
		session.guild = majorityGuild(me.groups) ?? null;
	} catch (err) {
		console.error('Failed to derive session state from /user', err);
	}
}

export async function bootstrapAuth(): Promise<void> {
	try {
		const state = await getAuthState();
		if (state === 'authenticated') {
			const token = await refreshAccessToken();
			if (token) {
				await activateSession(token);
			}
		} else if (state === 'authenticating') {
			// A previous login never came back (e.g. the SAML flow stranded on
			// an error page and the user navigated away). The server-side auth
			// session has a 30-minute TTL, so a pending state found at boot is
			// stale — reset so Landing offers a fresh attempt.
			await logout();
		}
	} catch (err) {
		console.error('Auth bootstrap failed', err);
	}
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

async function startNativeLogin(): Promise<void> {
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
			await activateSession(token);
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
	window.location.href = redirect;
}

/**
 * Finish the web SSO flow. The auth server redirected back here with
 * `?code=…&state=…`; exchange the code for tokens. Called from
 * /auth/callback. Returns whether a session was established.
 */
export async function finishWebLogin(): Promise<boolean> {
	session.isProcessing = true;
	try {
		const token = await finishLogin(window.location.href);
		if (token) {
			await activateSession(token);
			return true;
		}
		session.loginError = 'failed';
		return false;
	} finally {
		session.isProcessing = false;
	}
}
