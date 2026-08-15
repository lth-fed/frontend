import type { PageLoad } from './$types';
import { cachedGroups, cachedGroupSettings } from '$lib/api/groups';

export const load: PageLoad = async ({ depends }) => {
	const [groups, settings] = await Promise.all([
		cachedGroups(depends),
		cachedGroupSettings(depends)
	]);
	return { groups, settings };
};
