import type { PageLoad } from './$types';
import { cachedGroup, cachedGroups } from '$lib/api/groups';

export const load: PageLoad = async ({ params, depends }) => {
	const [group, groups] = await Promise.all([
		cachedGroup(params.id, depends),
		cachedGroups(depends)
	]);
	const childDepth = group.path.split('.').length + 1;
	const pathPrefix = `${group.path}.`;
	const subgroups = groups
		.filter(
			(candidate) =>
				!candidate.deleted &&
				candidate.path.startsWith(pathPrefix) &&
				candidate.path.split('.').length === childDepth
		)
		.sort((a, b) => a.name.localeCompare(b.name));

	return { group, subgroups };
};
