import {
	beginLogin,
	configureAuth,
	getAuthState,
	isAuthRedirectSuccess,
	refresh
} from 'auth-lib';
import { replaceState } from '$app/navigation';
import { session } from '$lib/state/session.svelte';

const dev = import.meta.env.DEV;
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
				session.ready = true;
				return;
			}
		}

		const redirect = await beginLogin('test', window.location.href);
		if (typeof redirect === 'string') {
			window.location.href = redirect;
			return;
		}
	} catch (err) {
		console.error('Auth bootstrap failed', err);
	}

	session.ready = true;
}
