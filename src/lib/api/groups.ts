import { api } from './clients';
import { DEMO_MODE, unwrap } from './call';
import { pickI18n } from './mappings';
import type { components } from './generated/api';

type RawGroup = components['schemas']['Group'];
type RawAdminship = components['schemas']['Adminship'];

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
};

export type Adminship = {
	groupPath: string;
	userId: string;
};

/** Payload for `createGroup`. Names and descriptions are passed as the
 *  i18n maps the backend stores directly; callers either build them up
 *  from a translation form or pass a single-locale `{ [activeLocale]: ... }`. */
export type CreateGroupInput = {
	path: string;
	name: Record<string, string>;
	description: Record<string, string>;
	limitMembershipVisibility: boolean;
};

function mapGroup(g: RawGroup): Group {
	return {
		id: g.id,
		path: g.path,
		name: pickI18n(g.name),
		description: pickI18n(g.description),
		limitMembershipVisibility: g.limit_membership_visibility,
		deleted: g.deleted
	};
}

function mapAdminship(a: RawAdminship): Adminship {
	return { groupPath: a.group_path, userId: a.user_id };
}

/**
 * List all groups the signed-in user is a direct or transitive member
 * of. Includes the root `tlth` and deeper subgroups (e.g.
 * `tlth.e.styrelsen`); callers wanting a guild code need to filter and
 * call `guildFromPath` themselves.
 */
export async function listGroups(): Promise<Group[]> {
	const raw = DEMO_MODE ? _mockGroups : await unwrap(() => api.GET('/groups', {}));
	return raw.map(mapGroup);
}

/**
 * Create a child group under the parent indicated by `path`. The caller
 * must be an admin of the parent; the wrapper surfaces backend 401/4xx
 * via `unwrap`.
 */
export async function createGroup(input: CreateGroupInput): Promise<Group> {
	const raw: RawGroup = DEMO_MODE
		? (() => {
				const created: RawGroup = {
					id: crypto.randomUUID(),
					path: input.path,
					name: input.name,
					description: input.description,
					limit_membership_visibility: input.limitMembershipVisibility,
					deleted: false
				};
				_mockGroups = [..._mockGroups, created];
				return created;
			})()
		: await unwrap(() =>
				api.POST('/groups', {
					body: {
						path: input.path,
						name: input.name,
						description: input.description,
						limit_membership_visibility: input.limitMembershipVisibility
					}
				})
			);
	return mapGroup(raw);
}

/** List members of a group. Admin-only on the backend. */
export async function listMembers(groupId: string): Promise<string[]> {
	if (DEMO_MODE) return _mockMembers[groupId] ?? [];
	return unwrap(() =>
		api.GET('/groups/{group_id}/members', {
			params: { path: { group_id: groupId } }
		})
	);
}

/** List admins of a group. Admin-only on the backend. */
export async function listAdmins(groupId: string): Promise<string[]> {
	if (DEMO_MODE) return _mockAdmins[groupId] ?? [];
	return unwrap(() =>
		api.GET('/groups/{group_id}/admins', {
			params: { path: { group_id: groupId } }
		})
	);
}

/** Grant admin rights. Caller must be admin of the parent group. */
export async function addAdmin(groupId: string, userId: string): Promise<Adminship> {
	const raw: RawAdminship = DEMO_MODE
		? { group_path: _mockGroupPath(groupId) ?? groupId, user_id: userId }
		: await unwrap(() =>
				api.POST('/groups/{group_id}/admins', {
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
		api.DELETE('/groups/{group_id}/admins/{user_id}', {
			params: { path: { group_id: groupId, user_id: userId } },
			body: userId
		})
	);
}

function _mockGroupPath(id: string): string | undefined {
	return _mockGroups.find((g) => g.id === id)?.path;
}

let _mockGroups: RawGroup[] = [
	{
		id: '00000000-0000-0000-0000-000000000001',
		path: 'tlth',
		limit_membership_visibility: false,
		name: { en: 'TLTH', sv: 'TLTH' },
		description: {
			en: 'The Student Union at Lund University Faculty of Engineering',
			sv: 'Teknologkåren vid Lunds Tekniska Högskola'
		},
		deleted: false
	},
	{
		id: '00000000-0000-0000-0000-000000000002',
		path: 'tlth.f',
		limit_membership_visibility: false,
		name: { en: 'F-section', sv: 'F-sektionen' },
		description: { en: 'Physics section', sv: 'Fysiksektionen' },
		deleted: false
	}
];

const _mockMembers: Record<string, string[]> = {};
const _mockAdmins: Record<string, string[]> = {};
