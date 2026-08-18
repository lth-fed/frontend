import { api } from './clients';
import { cached, invalidate } from './cache';
import { DEMO_MODE, unwrap } from './call';
import { pickI18n } from './mappings';
import type { components } from './generated/api';

type RawGroup = components['schemas']['Group'];
type RawFatGroup = components['schemas']['FatGroup'];
type RawAdminship = components['schemas']['Adminship'];
type RawJoinableGroup = components['schemas']['JoinableGroup'];

type Depends = (dep: `app:cache:${string}`) => void;

/** Backend `name` / `description` arrive as i18n maps — picked at the
 *  api boundary so the rest of the frontend can treat groups as flat
 *  strings keyed by `path`. */
export type Group = {
	id: string;
	/** ltree path, e.g. "tlth.f" or "tlth.e.styrelsen". */
	path: string;
	name: string;
	description: string;
	limitMembershipVisibility: boolean;
	deleted: boolean;
	logoUrl: string;
	/** User IDs of the group's direct administrators. Only populated by the tree endpoint. */
	adminIds: string[];
};

export type JoinableGroup = Group & { requested: boolean };

export type NotificationLevel = components['schemas']['NotificationLevel'];
export type GroupSetting = {
	groupId: string;
	visible: boolean;
	notificationLevel: NotificationLevel;
};

export type Adminship = {
	groupPath: string;
	userId: string;
};

/** Payload for `createGroup`. Names and descriptions are passed as the
 *  i18n maps the backend stores directly; callers either build them up
 *  from a translation form or pass a single-locale `{ [activeLocale]: ... }`. */
export type CreateGroupInput = {
	id: string;
	path: string;
	name: Record<string, string>;
	description: Record<string, string>;
	limitMembershipVisibility: boolean;
	logoId: string;
};

function mapGroup(g: RawGroup | RawFatGroup): Group {
	return {
		id: g.id,
		path: g.path,
		name: pickI18n(g.name),
		description: pickI18n(g.description),
		limitMembershipVisibility: g.limit_membership_visibility,
		deleted: g.deleted,
		logoUrl: g.logo_url,
		adminIds: 'admin_ids' in g ? (g.admin_ids ?? []) : []
	};
}

function mapJoinableGroup(group: RawJoinableGroup): JoinableGroup {
	return { ...mapGroup(group), requested: group.requested };
}

function mapAdminship(a: RawAdminship): Adminship {
	return { groupPath: a.group_path, userId: a.user_id };
}

/**
 * List groups with upcoming activities in the signed-in user's accessible
 * trees, including the groups' ancestors. Administrators receive their full
 * accessible trees. Callers wanting a guild code need to filter and call
 * `guildFromPath` themselves.
 */
export async function listGroups(): Promise<Group[]> {
	const raw = DEMO_MODE ? _mockGroups : await unwrap(() => api.GET('/groups/tree', {}));
	return raw.map(mapGroup);
}

export function cachedGroups(depends?: Depends): Promise<Group[]> {
	return cached('groups', 60_000, listGroups, depends);
}

/** Groups relevant to the visibility and notification filter interface. */
export async function listFilterGroups(): Promise<Group[]> {
	const raw = DEMO_MODE ? _mockGroups : await unwrap(() => api.GET('/groups/for-filters', {}));
	return raw.map(mapGroup);
}

export function cachedFilterGroups(depends?: Depends): Promise<Group[]> {
	return cached('filter-groups', 60_000, listFilterGroups, depends);
}

export async function getGroup(id: string): Promise<Group> {
	const groups = await listGroups();
	const group = groups.find((candidate) => candidate.id === id);
	if (!group) throw new Error(`Group ${id} is not visible to this user`);
	return group;
}

export function cachedGroup(id: string, depends?: Depends): Promise<Group> {
	return cached(`group:${id}`, 60_000, () => getGroup(id), depends);
}

export async function listJoinableGroups(): Promise<JoinableGroup[]> {
	if (DEMO_MODE) return [];
	const groups = await unwrap(() => api.GET('/groups/joinable', {}));
	return groups.filter((group) => !group.deleted).map(mapJoinableGroup);
}

export async function requestGroupMembership(groupId: string): Promise<void> {
	if (!DEMO_MODE) {
		await unwrap(() =>
			api.PUT('/groups/{group_id}/member-request', { params: { path: { group_id: groupId } } })
		);
	}
	invalidate('joinable-groups');
}

export function cachedJoinableGroups(depends?: Depends): Promise<JoinableGroup[]> {
	return cached('joinable-groups', 30_000, listJoinableGroups, depends);
}

export async function listGroupSettings(): Promise<GroupSetting[]> {
	if (DEMO_MODE) return [];
	const settings = await unwrap(() => api.GET('/user/group-settings', {}));
	return settings.map((setting) => ({
		groupId: setting.group_id,
		visible: setting.visible,
		notificationLevel: setting.notification_level
	}));
}

export function cachedGroupSettings(depends?: Depends): Promise<GroupSetting[]> {
	return cached('group-settings', 60_000, listGroupSettings, depends);
}

export async function setGroupSetting(setting: GroupSetting): Promise<void> {
	if (!DEMO_MODE) {
		await unwrap(() =>
			api.PUT('/user/group-settings', {
				body: {
					group_id: setting.groupId,
					visible: setting.visible,
					notification_level: setting.notificationLevel
				}
			})
		);
	}
	invalidate('group-settings', 'filter-groups', 'activities');
}

/** Leave a group the signed-in user directly belongs to. */
export async function leaveGroup(groupId: string): Promise<void> {
	if (!DEMO_MODE) {
		await unwrap(() =>
			api.DELETE('/groups/{group_id}', { params: { path: { group_id: groupId } } })
		);
	}
	invalidate('me', 'groups', 'filter-groups', 'group-settings', 'activities');
}

/**
 * Create a child group under the parent indicated by `path`. The caller
 * must be an admin of the parent; the wrapper surfaces backend 401/4xx
 * via `unwrap`.
 */
export async function createGroup(input: CreateGroupInput): Promise<void> {
	if (DEMO_MODE) {
		const created: RawGroup = {
			id: input.id,
			path: input.path,
			name: input.name,
			description: input.description,
			limit_membership_visibility: input.limitMembershipVisibility,
			deleted: false,
			logo_id: input.logoId,
			logo_url: ''
		};
		_mockGroups = [..._mockGroups, created];
		return;
	}

	await unwrap(() =>
		api.PUT('/admin/groups/{id}', {
			params: { path: { id: input.id } },
			body: {
				path: input.path,
				name: input.name,
				description: input.description,
				limit_membership_visibility: input.limitMembershipVisibility,
				logo_id: input.logoId
			}
		})
	);
}

/** List members of a group. Admin-only on the backend. */
export async function listMembers(groupId: string): Promise<{ userId: string; name?: string }[]> {
	if (DEMO_MODE) return (_mockMembers[groupId] ?? []).map((userId) => ({ userId }));
	const users = await unwrap(() =>
		api.GET('/admin/groups/{group_id}/members', {
			params: { path: { group_id: groupId } }
		})
	);
	return users.map((user) => ({ userId: user.user_id, name: user.name }));
}

/** List admins of a group. Admin-only on the backend. */
export async function listAdmins(groupId: string): Promise<{ userId: string; name?: string }[]> {
	if (DEMO_MODE) return (_mockAdmins[groupId] ?? []).map((userId) => ({ userId }));
	const users = await unwrap(() =>
		api.GET('/admin/groups/{group_id}/admins', {
			params: { path: { group_id: groupId } }
		})
	);
	return users.map((user) => ({ userId: user.user_id, name: user.name }));
}

/** Grant admin rights. Caller must be admin of the parent group. */
export async function addAdmin(groupId: string, userId: string): Promise<Adminship> {
	const raw: RawAdminship = DEMO_MODE
		? { group_path: _mockGroupPath(groupId) ?? groupId, user_id: userId }
		: await unwrap(() =>
				api.POST('/admin/groups/{group_id}/admins', {
					params: { path: { group_id: groupId } },
					body: { user_id: userId }
				})
			);
	return mapAdminship(raw);
}

/** Revoke admin rights. Caller must be admin of the parent group. */
export async function removeAdmin(groupId: string, userId: string): Promise<void> {
	if (DEMO_MODE) return;
	await unwrap(() =>
		api.DELETE('/admin/groups/{group_id}/admins/{user_id}', {
			params: { path: { group_id: groupId, user_id: userId } }
		})
	);
}

function _mockGroupPath(id: string): string | undefined {
	return _mockGroups.find((g) => g.id === id)?.path;
}

let _mockGroups: RawFatGroup[] = [
	{
		id: '00000000-0000-0000-0000-000000000001',
		path: 'tlth',
		limit_membership_visibility: false,
		name: { en: 'TLTH', sv: 'TLTH' },
		description: {
			en: 'The Student Union at Lund University Faculty of Engineering',
			sv: 'Teknologkåren vid Lunds Tekniska Högskola'
		},
		deleted: false,
		logo_id: '00000000-0000-0000-0000-000000000101',
		logo_url: '/guild-logos/default.svg',
		admin_ids: ['test:admin']
	},
	{
		id: '00000000-0000-0000-0000-000000000002',
		path: 'tlth.f',
		limit_membership_visibility: false,
		name: { en: 'F-section', sv: 'F-sektionen' },
		description: { en: 'Physics section', sv: 'Fysiksektionen' },
		deleted: false,
		logo_id: '00000000-0000-0000-0000-000000000102',
		logo_url: '/guild-logos/f.avif',
		admin_ids: ['test:f-admin']
	}
];

const _mockMembers: Record<string, string[]> = {};
const _mockAdmins: Record<string, string[]> = {};
