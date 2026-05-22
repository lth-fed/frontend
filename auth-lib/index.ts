import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export type Provider = 'lu' | 'email' | 'test';
export type UnknownError = null;
export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated';

const atLocation = 'teknologappen-auth-access-token';
const asLocation = 'teknologappen-auth-state';

let baseUrl = 'https://auth.teknologappen.se/api/v0';

/** Override the auth service base URL (e.g. http://localhost:8001/api/v0 in dev). */
export function configureAuth(opts: { baseUrl: string }) {
	baseUrl = opts.baseUrl;
}

export function getAuthState(): AuthState {
	const { value: v } = Preferences.get({ key: asLocation });
	if (v === 'authenticated' || v === 'authenticating') return v;

	return 'unauthenticated';
}

function setAuthState(state: AuthState) {
	Preferences.set({ key: asLocation, value: state });
}
/**
 * Begin logging in with SSO.
 *
 * The general flow is:
 * - call this, you get a URL back
 * - open the URL, either in an iframe or redirect to it
 *   - if in an iframe, call `onIframeResponse`
 * - the page at `continueUrl` will be redirected back to when the authentication is complete (set to "" if in an iframe)
 * - if redirected (not iframe) call the `isAuthRedirectSuccess` function on load on the page at `continueUrl`
 * - now the request middleware will get an access token
 */
export async function beginLogin(
	provider: Provider,
	continueUrl: string,
	serverCallbackUrl?: string
): Promise<string | UnknownError> {
	const body: { continue_url: string; callback?: { v1: string } } = {
		continue_url: continueUrl
	};

	if (serverCallbackUrl) {
		body.callback = { v1: serverCallbackUrl };
	}

	let response: Response;
	try {
		response = await fetch(`${baseUrl}/providers/${provider}`, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});
	} catch (_e) {
		return null;
	}

	if (!response.ok) return null;

	let redirect: string;
	try {
		redirect = await response.text();
	} catch (_e) {
		return null;
	}

	setAuthState('authenticating');

	return redirect;
}

export async function authenticatedFetch(
	options: HttpOptions & { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' },
	errorCallback: (userMessage: { [lang: string]: string }) => void
): Promise<HttpResponse> {
	// const at = localStorage.getItem(atLocation);
	const { value: at } = await Preferences.get({ key: atLocation });
	const data = at !== null ? JSON.parse(atob(at.split('.')[1])) : {};
	const now = +new Date() / 1000;

	let token = at;

	if (at === null || data.exp === null || data.nbf + (data.exp - data.nbf) / 2 < now) {
		if ((await Preferences.get({ key: asLocation })).value === 'authenticated') {
			// refresh!
			const newAt = await refreshAccessToken();

			if (newAt === null) {
				// we couldn't get a new token!
				await Preferences.remove({ key: atLocation });
				token = null;

				errorCallback({
					sv: 'Du kan ha blivit hackad! Autentifieringen misslyckades. Antingen var det mer än ett år sedan du loggade in eller så har någon tagit kontroll över din webbläsare och använder nu ditt konto.',
					en: 'You may have been hacked! Authentication failed. Either your last login was over a year ago, or someone has taken control of your browser and is now using your account.'
				});
			} else {
				token = newAt;
				await Preferences.set({ key: atLocation, value: newAt });
			}
		} else {
			// we don't have a token or it's invalid
			await Preferences.remove({ key: atLocation });
			token = null;
		}
	}

	return CapacitorHttp.request({
		...options,
		headers: {
			...options.headers,
			...(token !== null && {
				authorization: `Bearer ${token}`
			})
		}
	});
}

/**
 * Log the user out: invalidate the server-side refresh token, clear the
 * locally cached access token, and reset auth state to unauthenticated.
 *
 * The server call is best-effort — if it fails (offline, server down) we
 * still clear local state so the user is logged out client-side. The
 * server-side cleanup catches up on the next refresh attempt.
 */
export async function logout(): Promise<void> {
	try {
		await CapacitorHttp.post({
			url: `${baseUrl}/logout`,
			headers: { 'content-type': 'application/json' }
		});
	} catch (_e) {
		// ignore — we clear local state regardless
	}

	await Preferences.remove({ key: atLocation });
	setAuthState('unauthenticated');
}

export async function refreshAccessToken(): Promise<string | UnknownError> {
	try {
		const a = await CapacitorHttp.post({
			url: `${baseUrl}/refresh`,
			headers: {
				origin: window.location.origin,
				'content-type': 'application/json'
			}
		});
		if (!a.data || a.status !== 200) return null;

		const accessToken = a.data.access_token;
		if (typeof accessToken !== 'string') return null;

		await Preferences.set({ key: 'atLocation', value: accessToken });
		setAuthState('authenticated');

		return accessToken;
	} catch (_e) {
		return null;
	}
}
