import type { PageLoad } from './$types';
import { cachedFilterGroups, cachedGroupSettings } from '$lib/api/groups';

export const load: PageLoad = async ({ depends }) => {
	const [groups, settings] = await Promise.all([
		cachedFilterGroups(depends),
		cachedGroupSettings(depends)
	]);
	return { groups, settings };
};
