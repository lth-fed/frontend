import { getAuthState } from 'auth-lib';
import { replaceNavigation } from '$lib/navigation/stackNavigation';
import Routes from '$lib/navigation/routes';

// Skipped until auth is established so we don't fire authenticated API calls
// from Home's load before the access token is in place — that race lands the
// user on the error page after first login on device.
export const load = async () => {
	if ((await getAuthState()) !== 'authenticated') return;
	return replaceNavigation(Routes.Home, { resetDepth: true });
};
