import { beginLogin, configureAuth, getAuthState, refreshAccessToken } from 'auth-lib';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';
import { InAppBrowser } from '@capgo/inappbrowser';
import { CapacitorCookies } from '@capacitor/core';

const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0';

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

	session.ready = true;
}

/**
 * Kick off the SSO login flow via a secure in-app browser. On success the
 * redirect URI carries a refresh_token query param, which we drop into the
 * auth-domain cookie so the next /refresh mints an access token.
 */
export async function startLogin(): Promise<void> {
	try {
		const redirect = await beginLogin('test', 'tappen://oauth_callback');
		if (typeof redirect !== 'string') return;

		const response = await InAppBrowser.openSecureWindow({
			authEndpoint: redirect,
			redirectUri: 'tappen://oauth_callback',
			prefersEphemeralWebBrowserSession: true
		});

		const url = new URL(response.redirectedUri);
		const refreshToken = url.searchParams.get('refresh_token');
		if (!refreshToken) return;

		await CapacitorCookies.setCookie({
			url: 'https://auth.teknologappen.se',
			key: 'teknologappen-auth-refresh-token',
			value: refreshToken
		});

		const token = await refreshAccessToken();
		if (token) {
			session.accessToken = token;
		}
	} catch (err) {
		console.error('Login failed to start', err);
	}
}
