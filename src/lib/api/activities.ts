import { api } from './clients';
import { cached, peek, seed } from './cache';
import { DEMO_MODE, unwrap } from './call';
import { apiError } from './errors';
import { guildFromPath, parseDate, pickI18n } from './mappings';
import type { components } from './generated/api';
import type { Guild } from '$lib/types/guild';

type Depends = (dep: `app:cache:${string}`) => void;

type RawBrief = components['schemas']['BriefActivity'];
type RawActivity = components['schemas']['Activity'];
type RawTicketKind = components['schemas']['TicketKind'];
type RawHost = components['schemas']['Host'];
type RawLocation = components['schemas']['Location'];

/** A ticket kind for a given activity. `price` is in öre — components
 *  format via `$lib/format/money.ts`. `ticketsLeft` is `undefined` when
 *  the backend judged there's no shortage worth surfacing. */
export type TicketKind = {
	id: string;
	name: string;
	/** Price in öre. */
	price: number;
	purchasingAvailableStart: Date;
	purchasingAvailableStop: Date;
	ticketsLeft?: number;
	/** Whether the signed-in user's group memberships allow purchase. */
	membershipPassing: boolean;
};

/**
 * Activity card / detail shape. Both list and detail endpoints
 * populate everything here; the detail endpoint additionally fills
 * `organisers` from the full `hosts` list. `creatorGuild` is
 * `undefined` when `creator_path` doesn't resolve to a known guild
 * code — components fall back to the default un-themed look.
 *
 * `priceFrom` lives on the buy-ticket flow; it deliberately isn't
 * shown on cards (a single "from X kr" is misleading once after-party
 * tickets, members-only kinds, etc. enter the picture).
 */
export type Activity = {
	id: string;
	image: string;
	title: string;
	description: string;
	/** Display string for the location; empty if backend ships none. */
	location: string;
	startAt: Date;
	endAt: Date;
	creatorGuild?: Guild;
	/** Unique guild codes derived from `hosts` (creator + co-hosts).
	 *  Empty on list view (BriefActivity has no hosts), populated by
	 *  `getActivity`. */
	organisers: Guild[];
	/** `false` while the value is a list-derived placeholder — the
	 *  detail fetch is in flight and detail-only fields (`organisers`,
	 *  `ticketsExist`) aren't populated yet. Render skeletons. */
	full: boolean;
	/** Whether any ticket kind exists — gates the buy CTA (krav §5).
	 *  Only known when `full`. */
	ticketsExist?: boolean;
};

function mapTicketKind(t: RawTicketKind): TicketKind {
	return {
		id: t.id,
		name: pickI18n(t.name),
		price: t.price,
		purchasingAvailableStart: parseDate(t.purchasing_available_start),
		purchasingAvailableStop: parseDate(t.purchasing_available_stop),
		// The wire value is JSON null when there's no shortage to surface;
		// normalize so `!== undefined` checks behave.
		ticketsLeft: t.tickets_left ?? undefined,
		membershipPassing: t.membership_passing
	};
}

function locationString(loc: RawLocation): string {
	return pickI18n(loc.name);
}

/** Dedup unique guild codes from a hosts list. Hosts whose path
 *  doesn't resolve to a known guild are quietly skipped. */
function organisersFromHosts(hosts: RawHost[]): Guild[] {
	const seen = new Set<Guild>();
	for (const h of hosts) {
		const guild = guildFromPath(h.path);
		if (guild) seen.add(guild);
	}
	return [...seen];
}

function mapBrief(b: RawBrief): Activity {
	return {
		id: b.id,
		image: b.image_url,
		title: pickI18n(b.title),
		description: pickI18n(b.description),
		location: locationString(b.location),
		startAt: parseDate(b.time_start),
		endAt: parseDate(b.time_end),
		creatorGuild: guildFromPath(b.creator_path),
		organisers: [],
		full: false
	};
}

function mapActivity(a: RawActivity): Activity {
	return {
		id: a.id,
		image: a.image_url,
		title: pickI18n(a.title),
		description: pickI18n(a.description),
		location: locationString(a.location),
		startAt: parseDate(a.time_start),
		endAt: parseDate(a.time_end),
		creatorGuild: guildFromPath(a.creator_path),
		organisers: organisersFromHosts(a.hosts),
		full: true,
		ticketsExist: a.tickets_exist
	};
}

/** List activities visible to the signed-in user. */
export async function listActivities(): Promise<Activity[]> {
	const briefs = DEMO_MODE ? _mockBriefs : await unwrap(() => api.GET('/activities', {}));
	return briefs.map(mapBrief);
}

/** Fetch a single activity (full host list, no ticket kinds — those
 *  live on `getActivityTicketKinds`). */
export async function getActivity(id: string): Promise<Activity> {
	if (DEMO_MODE) {
		const raw = _mockActivities[id];
		if (!raw) apiError('not-found', `Activity "${id}" not found`);
		return mapActivity(raw);
	}
	const raw = await unwrap(() => api.GET('/activities/{id}', { params: { path: { id } } }));
	return mapActivity(raw);
}

/** Ticket kinds for an activity. Used by the buy-ticket page. */
export async function getActivityTicketKinds(id: string): Promise<TicketKind[]> {
	const raw = DEMO_MODE
		? (_mockTicketKinds[id] ?? [])
		: await unwrap(() =>
				api.GET('/activities/{id}/ticket-kinds', {
					params: { path: { id } }
				})
			);
	return raw.map(mapTicketKind);
}

/** Cached activity list (spec §3.3: 60 s stale-while-revalidate). */
export function cachedActivities(depends?: Depends): Promise<Activity[]> {
	return cached('activities', 60_000, listActivities, depends);
}

/**
 * Cached activity detail (5 min TTL). When nothing is cached yet but
 * the list holds a brief record, that record is seeded as an
 * always-stale placeholder — the page renders header fields instantly
 * (`full === false`) while the real fetch runs and re-renders via
 * load invalidation.
 */
export function cachedActivity(id: string, depends?: Depends): Promise<Activity> {
	const key = `activity:${id}`;
	if (peek(key) === undefined) {
		const brief = peek<Activity[]>('activities')?.find((a) => a.id === id);
		if (brief) seed(key, brief);
	}
	return cached(key, 300_000, () => getActivity(id), depends);
}

/** Cached ticket kinds (15 s TTL — `ticketsLeft` moves fast). */
export function cachedTicketKinds(id: string, depends?: Depends): Promise<TicketKind[]> {
	return cached(`kinds:${id}`, 15_000, () => getActivityTicketKinds(id), depends);
}

const _mockBriefs: RawBrief[] = [
	{
		id: 'a',
		creator_name: { en: 'A-sektionen', sv: 'A-sektionen' },
		creator_path: 'tlth.a',
		title: { en: 'Other sitting kinda', sv: 'Annan sittning typ' },
		description: {
			en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			sv: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
		},
		location: { name: { en: 'Gasque Hall', sv: 'Gasque-salen' } },
		time_start: '2026-04-27T17:00:00Z',
		time_end: '2026-04-27T23:00:00Z',
		image_url: 'https://picsum.photos/seed/home-a/640/360'
	},
	{
		id: 'b',
		creator_name: { en: 'D-sektionen', sv: 'D-sektionen' },
		creator_path: 'tlth.d',
		title: { en: 'Spring fest', sv: 'Vårfest' },
		description: {
			en: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
			sv: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
		},
		location: { name: { en: 'Kårhuset', sv: 'Kårhuset' } },
		time_start: '2026-05-01T21:00:00Z',
		time_end: '2026-05-02T02:00:00Z',
		image_url: 'https://picsum.photos/seed/home-b/640/360'
	},
	{
		id: 'c',
		creator_name: { en: 'I-sektionen', sv: 'I-sektionen' },
		creator_path: 'tlth.i',
		title: { en: 'Tuesday pub', sv: 'Tisdagspub' },
		description: {
			en: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
			sv: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
		},
		location: { name: { en: 'Pub lokal', sv: 'Pub-lokalen' } },
		time_start: '2026-05-05T18:00:00Z',
		time_end: '2026-05-05T23:00:00Z',
		image_url: 'https://picsum.photos/seed/home-c/640/360'
	}
];

const _mockActivities: Record<string, RawActivity> = {
	a: {
		id: 'a',
		responsible: { id: 'si1234mc-s', name: 'Simon Mechler' },
		creator_path: 'tlth.a',
		title: { en: 'Other sitting kinda', sv: 'Annan sittning typ' },
		description: {
			en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			sv: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
		},
		location: { name: { en: 'Gasque Hall', sv: 'Gasque-salen' } },
		time_start: '2026-04-27T17:00:00Z',
		time_end: '2026-04-27T23:00:00Z',
		image_url: 'https://picsum.photos/seed/home-a/640/360',
		hosts: [
			{
				id: '00000000-0000-0000-0000-0000000000a1',
				path: 'tlth.a',
				name: { en: 'A-sektionen', sv: 'A-sektionen' },
				logo_url: '/guild-logos/a.avif'
			},
			{
				id: '00000000-0000-0000-0000-0000000000f1',
				path: 'tlth.f',
				name: { en: 'F-sektionen', sv: 'F-sektionen' },
				logo_url: '/guild-logos/f.avif'
			}
		],
		tickets_exist: true
	},
	b: {
		id: 'b',
		responsible: { id: 'si1234mc-s', name: 'Simon Mechler' },
		creator_path: 'tlth.d',
		title: { en: 'Spring fest', sv: 'Vårfest' },
		description: {
			en: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
			sv: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
		},
		location: { name: { en: 'Kårhuset', sv: 'Kårhuset' } },
		time_start: '2026-05-01T21:00:00Z',
		time_end: '2026-05-02T02:00:00Z',
		image_url: 'https://picsum.photos/seed/home-b/640/360',
		hosts: [
			{
				id: '00000000-0000-0000-0000-0000000000d1',
				path: 'tlth.d',
				name: { en: 'D-sektionen', sv: 'D-sektionen' },
				logo_url: '/guild-logos/d.avif'
			}
		],
		tickets_exist: true
	},
	c: {
		id: 'c',
		responsible: { id: 'si1234mc-s', name: 'Simon Mechler' },
		creator_path: 'tlth.i',
		title: { en: 'Tuesday pub', sv: 'Tisdagspub' },
		description: {
			en: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
			sv: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
		},
		location: { name: { en: 'Pub lokal', sv: 'Pub-lokalen' } },
		time_start: '2026-05-05T18:00:00Z',
		time_end: '2026-05-05T23:00:00Z',
		image_url: 'https://picsum.photos/seed/home-c/640/360',
		hosts: [
			{
				id: '00000000-0000-0000-0000-0000000000i1',
				path: 'tlth.i',
				name: { en: 'I-sektionen', sv: 'I-sektionen' },
				logo_url: '/guild-logos/i.avif'
			}
		],
		tickets_exist: true
	}
};

const _mockTicketKinds: Record<string, RawTicketKind[]> = {
	a: [
		{
			id: '00000000-0000-0000-0000-00000000a001',
			name: { en: 'Standard', sv: 'Standard' },
			price: 12000,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-27T12:00:00Z',
			membership_passing: true
		},
		{
			id: '00000000-0000-0000-0000-00000000a002',
			name: { en: 'VIP', sv: 'VIP' },
			price: 22000,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-27T12:00:00Z',
			tickets_left: 5,
			membership_passing: true
		},
		{
			id: '00000000-0000-0000-0000-00000000a003',
			name: { en: 'Sponsor', sv: 'Sponsor' },
			price: 0,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-27T12:00:00Z',
			membership_passing: true
		}
	],
	b: [
		{
			id: '00000000-0000-0000-0000-00000000b001',
			name: { en: 'Early bird', sv: 'Early bird' },
			price: 8000,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-15T00:00:00Z',
			membership_passing: true
		},
		{
			id: '00000000-0000-0000-0000-00000000b002',
			name: { en: 'Standard', sv: 'Standard' },
			price: 11000,
			purchasing_available_start: '2026-04-15T00:00:00Z',
			purchasing_available_stop: '2026-05-01T12:00:00Z',
			membership_passing: true
		},
		{
			id: '00000000-0000-0000-0000-00000000b003',
			name: { en: 'After party', sv: 'After party' },
			price: 5000,
			purchasing_available_start: '2026-05-01T00:00:00Z',
			purchasing_available_stop: '2026-05-02T01:00:00Z',
			membership_passing: true
		}
	],
	c: [
		{
			id: '00000000-0000-0000-0000-00000000c001',
			name: { en: 'Entry', sv: 'Entré' },
			price: 4000,
			purchasing_available_start: '2026-05-01T00:00:00Z',
			purchasing_available_stop: '2026-05-05T17:00:00Z',
			membership_passing: true
		},
		{
			id: '00000000-0000-0000-0000-00000000c002',
			name: { en: 'Member', sv: 'Medlem' },
			price: 0,
			purchasing_available_start: '2026-05-01T00:00:00Z',
			purchasing_available_stop: '2026-05-05T17:00:00Z',
			membership_passing: true
		}
	]
};
