import { logout as authLogout } from 'auth-lib';
import { session } from '$lib/state/session.svelte';
import { clearCache } from '$lib/api/cache';
import { replaceNavigation } from '$lib/navigation/stackNavigation';
import Routes from '$lib/navigation/routes';

/**
 * Sign the user out: tear down server-side + local auth state and the
 * API cache (no data crosses sessions), then reload the SPA root so
 * `bootstrapAuth()` runs again from a clean unauthenticated state.
 */
export async function logout(): Promise<void> {
	await authLogout();
	session.accessToken = null;
	clearCache();

	return replaceNavigation(Routes.Root, { resetDepth: true });
}
