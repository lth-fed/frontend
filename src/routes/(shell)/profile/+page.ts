import type { PageLoad } from './$types';
import { cachedMe } from '$lib/api/user';

export const load: PageLoad = async ({ depends }) => {
	const me = await cachedMe(depends);
	return { me };
};
