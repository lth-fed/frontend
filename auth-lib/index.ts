import { CapacitorHttp, type HttpOptions, type HttpResponse } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export type Provider = 'lu' | 'email' | 'test';
export type UnknownError = null;
export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated';

const CLIENT_ID = 'teknologappen';

const atLocation = 'teknologappen-auth-access-token';
const rtLocation = 'teknologappen-auth-refresh-token';
const asLocation = 'teknologappen-auth-state';
const verifierLocation = 'teknologappen-auth-pkce-verifier';
const oauthStateLocation = 'teknologappen-auth-oauth-state';
const redirectUriLocation = 'teknologappen-auth-redirect-uri';

let origin = 'https://auth.teknologappen.se';

/** Override the auth service origin (e.g. http://localhost:8001 in dev). */
export function configureAuth(opts: { origin: string }) {
	origin = opts.origin;
}

const tokenEndpoint = () => `${origin}/oidc/v1/token`;
const authorizeEndpoint = () => `${origin}/oidc/v1/authorize`;

export async function getAuthState(): Promise<AuthState> {
	const { value: v } = await Preferences.get({ key: asLocation });
	if (v === 'authenticated' || v === 'authenticating') return v;

	return 'unauthenticated';
}

async function setAuthState(state: AuthState) {
	await Preferences.set({ key: asLocation, value: state });
}

function base64UrlEncode(bytes: Uint8Array): string {
	let s = '';
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomUrlSafe(byteCount = 32): string {
	const bytes = new Uint8Array(byteCount);
	crypto.getRandomValues(bytes);
	return base64UrlEncode(bytes);
}

async function sha256(input: string): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)));
}

type TokenResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	id_token: string;
};

async function requestTokens(form: Record<string, string>): Promise<TokenResponse | UnknownError> {
	let response: HttpResponse;
	try {
		response = await CapacitorHttp.post({
			url: tokenEndpoint(),
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			data: form
		});
	} catch (_e) {
		return null;
	}

	if (response.status !== 200 || typeof response.data?.access_token !== 'string') {
		// OAuth2 errors come back as { error, error_description }
		console.error('token request failed', response.status, response.data);
		return null;
	}

	return response.data as TokenResponse;
}

async function storeTokens(tokens: TokenResponse): Promise<void> {
	await Preferences.set({ key: atLocation, value: tokens.access_token });
	await Preferences.set({ key: rtLocation, value: tokens.refresh_token });
	await setAuthState('authenticated');
}

/**
 * Begin logging in with SSO (OIDC Authorization Code flow with PKCE).
 *
 * The general flow is:
 * - call this, you get the authorization URL back
 * - open the URL (top-level redirect on web, secure in-app browser on native)
 * - the auth server eventually redirects back to `continueUrl` with
 *   `?code=…&state=…` in the query
 * - pass that full redirected URL to `finishLogin` to exchange the code
 *   for tokens; the request middleware then gets an access token
 *
 * `serverCallbackUrl` is forwarded to the auth server, which POSTs the
 * signed user JWT there (server-to-server) during the token exchange.
 */
export async function beginLogin(
	provider: Provider,
	continueUrl: string,
	serverCallbackUrl?: string
): Promise<string | UnknownError> {
	const state = randomUrlSafe();
	const verifier = randomUrlSafe(48);
	let challenge: string;
	try {
		challenge = base64UrlEncode(await sha256(verifier));
	} catch (_e) {
		// crypto.subtle is only available in secure contexts
		return null;
	}

	// the exact redirect_uri must be repeated in the token exchange
	await Preferences.set({ key: verifierLocation, value: verifier });
	await Preferences.set({ key: oauthStateLocation, value: state });
	await Preferences.set({ key: redirectUriLocation, value: continueUrl });

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: continueUrl,
		response_type: 'code',
		scope: 'openid',
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256',
		providers: provider
	});
	if (serverCallbackUrl) params.set('callback_url_v1', serverCallbackUrl);

	await setAuthState('authenticating');

	return `${authorizeEndpoint()}?${params}`;
}

/**
 * Complete the Authorization Code flow. Pass the URL the auth server
 * redirected back to (it carries `?code=…&state=…`); the code is
 * exchanged for tokens which are stored locally. Returns the access
 * token, or null if the state doesn't match / the exchange fails.
 */
export async function finishLogin(redirectedUrl: string): Promise<string | UnknownError> {
	let code: string | null;
	let returnedState: string | null;
	try {
		const url = new URL(redirectedUrl);
		if (url.searchParams.get('error') !== null) {
			console.error(
				'authorization failed',
				url.searchParams.get('error'),
				url.searchParams.get('error_description')
			);
			return null;
		}
		code = url.searchParams.get('code');
		returnedState = url.searchParams.get('state');
	} catch (_e) {
		return null;
	}
	if (code === null) return null;

	const { value: expectedState } = await Preferences.get({ key: oauthStateLocation });
	const { value: verifier } = await Preferences.get({ key: verifierLocation });
	const { value: redirectUri } = await Preferences.get({ key: redirectUriLocation });
	if (verifier === null || redirectUri === null) return null;
	if (expectedState === null || returnedState !== expectedState) return null;

	const tokens = await requestTokens({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
		client_id: CLIENT_ID,
		code_verifier: verifier
	});

	await Preferences.remove({ key: verifierLocation });
	await Preferences.remove({ key: oauthStateLocation });
	await Preferences.remove({ key: redirectUriLocation });

	if (tokens === null) return null;

	await storeTokens(tokens);
	return tokens.access_token;
}

export async function authenticatedFetch(
	options: HttpOptions & { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' },
	errorCallback: (userMessage: { [lang: string]: string }) => void
): Promise<HttpResponse> {
	const { value: at } = await Preferences.get({ key: atLocation });
	let claims: { exp?: number; nbf?: number } = {};
	if (at !== null) {
		try {
			claims = JSON.parse(atob(at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		} catch (_e) {
			// unparsable token — treat as expired
		}
	}
	const now = +new Date() / 1000;

	let token = at;

	if (
		at === null ||
		claims.exp == null ||
		claims.nbf == null ||
		claims.nbf + (claims.exp - claims.nbf) / 2 < now
	) {
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
 * Log the user out by dropping the locally stored tokens. The OIDC API
 * has no revocation endpoint (yet); refresh tokens are single-use and
 * the only copy of the current one is deleted here, so the server-side
 * record can never be redeemed after this.
 */
export async function logout(): Promise<void> {
	await Preferences.remove({ key: atLocation });
	await Preferences.remove({ key: rtLocation });
	await setAuthState('unauthenticated');
}

let refreshInFlight: Promise<string | UnknownError> | null = null;

/**
 * Rotate the refresh token and mint a new access token. Single-flight:
 * refresh tokens are single-use on the server, so concurrent callers
 * must share one request — a second parallel attempt would redeem an
 * already-consumed token and get logged out.
 */
export function refreshAccessToken(): Promise<string | UnknownError> {
	refreshInFlight ??= doRefresh().finally(() => {
		refreshInFlight = null;
	});
	return refreshInFlight;
}

async function doRefresh(): Promise<string | UnknownError> {
	const { value: refreshToken } = await Preferences.get({ key: rtLocation });
	if (refreshToken === null) return null;

	let response: HttpResponse;
	try {
		response = await CapacitorHttp.post({
			url: tokenEndpoint(),
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			data: { grant_type: 'refresh_token', refresh_token: refreshToken }
		});
	} catch (_e) {
		// network error — keep local state, a later attempt may succeed
		return null;
	}

	if (response.status !== 200 || typeof response.data?.access_token !== 'string') {
		// the server rejected the token (consumed or expired); it will
		// never work again, so drop to unauthenticated
		console.error('refresh failed', response.status, response.data);
		await Preferences.remove({ key: atLocation });
		await Preferences.remove({ key: rtLocation });
		await setAuthState('unauthenticated');
		return null;
	}

	await storeTokens(response.data as TokenResponse);
	return response.data.access_token;
}
