import type { PageLoad } from './$types';
import { getProfile } from '$lib/api/profile';

export const load: PageLoad = async ({ fetch }) => {
	const profile = await getProfile({ fetch });
	return { profile };
};
