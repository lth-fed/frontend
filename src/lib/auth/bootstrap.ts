import { beginLogin, configureAuth, getAuthState, refreshAccessToken } from 'auth-lib';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';
import { getMe, majorityGuild } from '$lib/api/user';
import { replaceNavigation } from '$lib/navigation/stackNavigation';
import Routes from '$lib/navigation/routes';
import { InAppBrowser } from '@capgo/inappbrowser';
import { Capacitor, CapacitorCookies } from '@capacitor/core';

const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0';
const AUTH_ORIGIN = dev ? 'http://localhost:8001' : 'https://auth.teknologappen.se';
const NATIVE_CONTINUE = 'tappen://oauth_callback';
/** URL fed-auth POSTs the signed JWT to so fed-tickets can upsert the
 *  user record after sign-in. In dev we route through the vite proxy
 *  so fed-auth's callback-authority check (now suffix-matched against
 *  Origin) lines up; in prod the call goes direct to
 *  api.teknologappen.se. Server-to-server, never reaches the browser
 *  as a navigation. */
const BACKEND_CALLBACK_V1 = dev
	? `${typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin}/_proxy/api/user/auth-callback/v1`
	: 'https://api.teknologappen.se/v0/user/auth-callback/v1';

configureAuth({ baseUrl: AUTH_BASE });

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
		const me = await getMe();
		session.userId = me.id;
		session.guild = majorityGuild(me.groups) ?? null;
	} catch (err) {
		console.error('Failed to derive session state from /user', err);
	}
}

export async function bootstrapAuth(): Promise<void> {
	try {
		if ((await getAuthState()) === 'authenticated') {
			const token = await refreshAccessToken();
			if (token) {
				await activateSession(token);
			}
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
	try {
		if (Capacitor.isNativePlatform()) {
			await startNativeLogin();
		} else {
			await startWebLogin();
		}
	} catch (err) {
		console.error('Login failed to start', err);
	}
}

async function startNativeLogin(): Promise<void> {
	const redirect = await beginLogin('test', NATIVE_CONTINUE, BACKEND_CALLBACK_V1);
	if (typeof redirect !== 'string') return;

	session.isProcessing = true;
	const response = await InAppBrowser.openSecureWindow({
		authEndpoint: redirect,
		redirectUri: NATIVE_CONTINUE,
		prefersEphemeralWebBrowserSession: true
	});

	const url = new URL(response.redirectedUri);
	const refreshToken = url.searchParams.get('refresh_token');
	if (!refreshToken) return;

	// In-app browser cookies are isolated from the WebView jar — copy the
	// token over so the next /refresh sends it.
	await CapacitorCookies.setCookie({
		url: AUTH_ORIGIN,
		key: 'teknologappen-auth-refresh-token',
		value: refreshToken
	});

	const token = await refreshAccessToken();
	if (token) {
		await activateSession(token);
		// Token is now in Preferences + session; safe to land on the
		// authenticated home and let its load fire API calls.
		await replaceNavigation(Routes.Home, { resetDepth: true });
	}
	session.isProcessing = false;
}

async function startWebLogin(): Promise<void> {
	const continueUrl = `${window.location.origin}/auth/callback/`;
	const redirect = await beginLogin('test', continueUrl, BACKEND_CALLBACK_V1);
	if (typeof redirect !== 'string') return;

	session.isProcessing = true;
	window.location.href = redirect;
}

/**
 * Finish the web SSO flow. The auth server sets the refresh-token cookie
 * itself during confirm-datasharing, so all we have to do is mint an access
 * token. Called from /auth/callback.
 */
export async function finishWebLogin(): Promise<void> {
	session.isProcessing = true;
	try {
		const token = await refreshAccessToken();
		if (token) {
			await activateSession(token);
		}
	} finally {
		session.isProcessing = false;
	}
}
