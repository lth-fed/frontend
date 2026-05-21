import { beginLogin, configureAuth, getAuthState, isAuthRedirectSuccess, refresh } from 'auth-lib';
import { replaceState } from '$app/navigation';
import { dev } from '$app/environment';
import { session } from '$lib/state/session.svelte';

const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0';

configureAuth({ baseUrl: AUTH_BASE });

function consumeValidatedQueryParam(): boolean {
	const url = new URL(window.location.href);
	if (!url.searchParams.has('validated')) return false;
	isAuthRedirectSuccess();
	url.searchParams.delete('validated');
	const cleaned = url.pathname + (url.search ? url.search : '') + url.hash;
	replaceState(cleaned, history.state ?? {});
	return true;
}

export async function bootstrapAuth(): Promise<void> {
	try {
		consumeValidatedQueryParam();

		if (getAuthState() === 'authenticated') {
			const token = await refresh();
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
 * Kick off the SSO login flow. The user is redirected to the auth provider
 * and lands back on the current URL with `?validated=true` on success, which
 * `bootstrapAuth` then consumes.
 */
export async function startLogin(): Promise<void> {
	try {
		const redirect = await beginLogin('test', window.location.href);
		if (typeof redirect === 'string') {
			window.location.href = redirect;
		}
	} catch (err) {
		console.error('Login failed to start', err);
	}
}
