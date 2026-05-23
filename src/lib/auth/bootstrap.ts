import { beginLogin, configureAuth, getAuthState, refreshAccessToken } from 'auth-lib';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';
import { InAppBrowser } from '@capgo/inappbrowser';
import { Capacitor, CapacitorCookies } from '@capacitor/core';

const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0';
const AUTH_ORIGIN = dev ? 'http://localhost:8001' : 'https://auth.teknologappen.se';
const NATIVE_CALLBACK = 'tappen://oauth_callback';

configureAuth({ baseUrl: AUTH_BASE });

export async function bootstrapAuth(): Promise<void> {
	try {
		if ((await getAuthState()) === 'authenticated') {
			const token = await refreshAccessToken();
			if (token) {
				session.accessToken = token;
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
	const redirect = await beginLogin('test', NATIVE_CALLBACK);
	if (typeof redirect !== 'string') return;

	session.isProcessing = true;
	const response = await InAppBrowser.openSecureWindow({
		authEndpoint: redirect,
		redirectUri: NATIVE_CALLBACK,
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
		session.accessToken = token;
	}
	session.isProcessing = false;
}

async function startWebLogin(): Promise<void> {
	const callback = `${window.location.origin}/auth/callback`;
	const redirect = await beginLogin('test', callback);
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
			session.accessToken = token;
		}
	} finally {
		session.isProcessing = false;
	}
}
