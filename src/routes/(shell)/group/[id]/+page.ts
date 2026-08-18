import type { PageLoad } from './$types';
import { cachedGroup, cachedGroups, cachedGroupSettings } from '$lib/api/groups';
import { cachedMe } from '$lib/api/user';

export const load: PageLoad = async ({ params, depends }) => {
	const [group, groups, settings, me] = await Promise.all([
		cachedGroup(params.id, depends),
		cachedGroups(depends),
		cachedGroupSettings(depends),
		cachedMe(depends)
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

	const explicitSetting = settings.find((setting) => setting.groupId === group.id);
	const inheritedSetting =
		explicitSetting ??
		settings
			.filter((setting) => {
				const ancestor = groups.find((candidate) => candidate.id === setting.groupId);
				return ancestor && group.path.startsWith(`${ancestor.path}.`);
			})
			.sort((left, right) => {
				const leftPath = groups.find((candidate) => candidate.id === left.groupId)?.path ?? '';
				const rightPath = groups.find((candidate) => candidate.id === right.groupId)?.path ?? '';
				return rightPath.length - leftPath.length;
			})[0];

	return {
		group,
		subgroups,
		setting: inheritedSetting ?? {
			groupId: group.id,
			visible: true,
			notificationLevel: 'personalized' as const
		},
		isMember: me.groups.some((membership) => membership.id === group.id)
	};
};
