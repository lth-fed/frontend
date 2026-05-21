import type { Guild } from '$lib/types/guild';
import type { ApiCallOpts } from './clients';

export type Profile = {
	/** Full display name. */
	name: string;
	/** LU-style student ID, e.g. "si1234mc-s". */
	studentId: string;
	/** Section / guild membership. */
	section: Guild;
};

/**
 * Fetch the signed-in user's profile.
 *
 * Backed by mock data while the backend `/me` endpoint is pending. The
 * real-call body will wrap the openapi-fetch call through `unwrap` from
 * `./errors`; the signature here is stable across the swap.
 */
export async function getProfile(_opts: ApiCallOpts = {}): Promise<Profile> {
	return _mock;
}

const _mock: Profile = {
	name: 'Simon Mechler',
	studentId: 'si1234mc-s',
	section: 'f'
};
