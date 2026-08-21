import { Capacitor, CapacitorHttp, type HttpOptions, type HttpResponse } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export type Provider = 'lu' | 'email' | 'test';
export type UnknownError = null;
export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated';

const CLIENT_ID = 'teknologappen';
const EXTERNAL_VALIDATION_TOKEN = 'test:external-validation';

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

/**
 * Start the shared, normal-user session used by external app validators.
 * The token is deliberately not a secret; minilith accepts only this exact
 * identity and applies the account's ordinary database permissions.
 */
export async function useExternalValidationAccount(): Promise<string> {
	await Preferences.set({ key: atLocation, value: EXTERNAL_VALIDATION_TOKEN });
	await Preferences.remove({ key: rtLocation });
	await Preferences.remove({ key: verifierLocation });
	await Preferences.remove({ key: oauthStateLocation });
	await Preferences.remove({ key: redirectUriLocation });
	await setAuthState('authenticated');
	return EXTERNAL_VALIDATION_TOKEN;
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
		response = await postTokenForm(form, 30_000);
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

async function postTokenForm(
	form: Record<string, string>,
	timeoutMs: number
): Promise<HttpResponse> {
	const abort = new AbortController();
	const abortTimer = setTimeout(() => abort.abort(), timeoutMs);
	try {
		return await CapacitorHttp.post({
			url: tokenEndpoint(),
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			data: form,
			connectTimeout: timeoutMs,
			readTimeout: timeoutMs,
			webFetchExtra: Capacitor.isNativePlatform() ? undefined : { signal: abort.signal }
		});
	} finally {
		clearTimeout(abortTimer);
	}
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

/** Whether a stored access token is still worth sending: parsable, and
 *  not yet past the half-way point of its validity window. */
function accessTokenFresh(at: string | null): boolean {
	if (at === null) return false;
	if (at === EXTERNAL_VALIDATION_TOKEN) return true;
	let claims: { exp?: number; nbf?: number };
	try {
		claims = JSON.parse(atob(at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
	} catch (_e) {
		// unparsable token — treat as expired
		return false;
	}
	if (claims.exp == null || claims.nbf == null) return false;
	return claims.nbf + (claims.exp - claims.nbf) / 2 >= +new Date() / 1000;
}

/**
 * The access token to use now: the stored one while it's still fresh,
 * otherwise a refreshed one.
 *
 * Prefer this over calling `refreshAccessToken` directly. Refresh tokens
 * are single-use, so spending one when the current access token is still
 * good is how a second page load ends up redeeming a consumed token.
 */
export async function getAccessToken(): Promise<string | UnknownError> {
	const { value: at } = await Preferences.get({ key: atLocation });
	if (accessTokenFresh(at)) return at;
	if ((await getAuthState()) !== 'authenticated') return null;
	return refreshAccessToken();
}

export async function authenticatedFetch(
	options: HttpOptions & { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' },
	errorCallback: (userMessage: { [lang: string]: string }) => void
): Promise<HttpResponse> {
	// Every protected request passes this gate. It returns the current access
	// token only while fresh and otherwise completes the single-flight refresh
	// before the Minilith request is allowed onto the network.
	const token = await getAccessToken();
	if (token === null) {
		errorCallback({
			sv: 'Kunde inte förnya inloggningen. Försök igen när du har internetanslutning.',
			en: 'Could not refresh the login. Try again when you have a network connection.'
		});
		throw new Error('A fresh access token is required before making an API request');
	}

	return CapacitorHttp.request({
		...options,
		headers: {
			...options.headers,
			authorization: `Bearer ${token}`
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
	return attemptRefresh(refreshToken, true);
}

async function attemptRefresh(
	refreshToken: string,
	mayRetry: boolean
): Promise<string | UnknownError> {
	let response: HttpResponse | null = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			response = await postTokenForm(
				{ grant_type: 'refresh_token', refresh_token: refreshToken },
				5_000
			);
			break;
		} catch (error) {
			console.warn(`refresh transport attempt ${attempt + 1} failed`, error);
		}
	}
	// Preserve the refresh token after two transport failures so a user-triggered retry can try
	// again. `postTokenForm` aborts the timed-out request before this returns.
	if (response === null) return null;

	if (response.status !== 200 || typeof response.data?.access_token !== 'string') {
		// A refresh token has no time-based expiry. Transport/server failures and
		// malformed successful responses therefore must not destroy it; keep the
		// authenticated state so the next API attempt can retry the refresh.
		if (response.status >= 500 || response.status === 429 || response.status === 200) {
			console.error('temporary refresh failure', response.status, response.data);
			return null;
		}
		// The single-flight guard above only covers this JS context. On the web
		// every page load bootstraps its own refresh, so a navigation that lands
		// mid-rotation redeems a token the previous page already consumed. That
		// is a lost race, not a compromised session — if the stored token has
		// since changed, adopt the winner's result instead of logging out.
		if (mayRetry) {
			const rotated = await awaitRotation(refreshToken);
			if (rotated !== null) return attemptRefresh(rotated, false);
		}
		// The server rejected this token (normally because another context
		// consumed it during rotation). Refresh tokens have no time-based
		// expiry, but a consumed token cannot be redeemed again.
		console.error('refresh failed', response.status, response.data);
		await Preferences.remove({ key: atLocation });
		await Preferences.remove({ key: rtLocation });
		await setAuthState('unauthenticated');
		return null;
	}

	await storeTokens(response.data as TokenResponse);
	return response.data.access_token;
}

/** Briefly wait for another context to publish a rotated refresh token.
 *  Resolves to the new token, or null if none appeared. */
async function awaitRotation(sent: string): Promise<string | null> {
	for (let attempt = 0; attempt < 10; attempt++) {
		const { value } = await Preferences.get({ key: rtLocation });
		if (value !== null && value !== sent) return value;
		await new Promise((resolve) => setTimeout(resolve, 150));
	}
	return null;
}
