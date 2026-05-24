import type { PageLoad } from './$types';
import { getMe } from '$lib/api/user';

export const load: PageLoad = async ({ fetch }) => {
	const me = await getMe({ fetch });
	return { me };
};
