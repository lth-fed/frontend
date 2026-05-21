import { logout as authLogout } from 'auth-lib';
import { session } from '$lib/state/session.svelte';

/**
 * Sign the user out: tear down server-side + local auth state, then
 * reload the SPA root so `bootstrapAuth()` runs again from a clean
 * unauthenticated state.
 */
export async function logout(): Promise<void> {
	await authLogout();
	session.accessToken = null;
	session.ready = false;
	window.location.href = '/';
}
