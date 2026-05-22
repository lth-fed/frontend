import { beginLogin, configureAuth, getAuthState, refreshAccessToken } from 'auth-lib';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';
import { InAppBrowser } from '@capgo/inappbrowser';
import { CapacitorCookies } from '@capacitor/core';

const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0';

configureAuth({ baseUrl: AUTH_BASE });

// TODO: I really believe major parts of this auth logic should live in hooks instead (that includes auth-lib).
export async function bootstrapAuth(): Promise<void> {
	try {
		if ((await getAuthState()) === 'authenticated') {
			const token = await refreshAccessToken();
			if (token) {
				session.accessToken = token;
				session.ready = true;

				return;
			}
		}

		const redirect = await beginLogin('test', 'tappen://oauth_callback');
		if (typeof redirect === 'string') {
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

			await refreshAccessToken();
		}
	} catch (err) {
		console.error('Auth bootstrap failed', err);
	}

	session.ready = true;
}
