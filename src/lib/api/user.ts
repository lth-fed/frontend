import { api } from './clients';
import { DEMO_MODE, unwrap } from './call';
import { guildFromPath, parseDate, pickI18n } from './mappings';
import type { ApiCallOpts } from './clients';
import type { components } from './generated/api';
import type { Guild } from '$lib/types/guild';

type RawMe = components['schemas']['Me'];

/** A group the signed-in user is a direct member of. Names and
 *  descriptions are picked at the api boundary. */
export type MyGroup = {
	id: string;
	path: string;
	name: string;
	description: string;
	logoUrl: string;
};

export type Me = {
	id: string;
	name: string;
	/** Preferred-language string from the backend (BCP-47 / locale code). */
	language: string;
	creation: Date;
	groups: MyGroup[];
};

function mapMe(raw: RawMe): Me {
	return {
		id: raw.id,
		name: raw.name,
		language: raw.language,
		creation: parseDate(raw.creation),
		groups: raw.groups.map((g) => ({
			id: g.id,
			path: g.path,
			name: pickI18n(g.name),
			description: pickI18n(g.description),
			logoUrl: g.logo_url
		}))
	};
}

/** Fetch the signed-in user. */
export async function getMe(opts: ApiCallOpts = {}): Promise<Me> {
	const raw = DEMO_MODE ? _mockMe : await unwrap(() => api.GET('/user', {}));
	return mapMe(raw);
}

/**
 * Pick the user's "primary" guild by majority vote across their group
 * memberships — covers users who are in multiple subsections (e.g.
 * `tlth.f`, `tlth.f.styrelsen`, `tlth.f.nolla`, `tlth.e.styrelsen` →
 * `'f'` wins 3-to-1). Returns `undefined` when no membership resolves
 * to a known guild code, leaving the UI on the default theme.
 */
export function majorityGuild(groups: MyGroup[]): Guild | undefined {
	const counts = new Map<Guild, number>();
	for (const g of groups) {
		const guild = guildFromPath(g.path);
		if (!guild) continue;
		counts.set(guild, (counts.get(guild) ?? 0) + 1);
	}
	let best: Guild | undefined;
	let bestCount = 0;
	for (const [guild, count] of counts) {
		if (count > bestCount) {
			best = guild;
			bestCount = count;
		}
	}
	return best;
}

const _mockMe: RawMe = {
	id: 'si1234mc-s',
	name: 'Simon Mechler',
	language: 'sv',
	creation: '2024-08-15T09:00:00Z',
	groups: [
		{
			id: '00000000-0000-0000-0000-000000000010',
			path: 'tlth.f',
			name: { en: 'F-section', sv: 'F-sektionen' },
			description: { en: 'Physics section', sv: 'Fysiksektionen' },
			logo_url: '/guild-logos/f.avif'
		}
	]
};
