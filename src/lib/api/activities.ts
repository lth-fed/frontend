import { api } from './clients';
import { cached, peek, seed } from './cache';
import { DEMO_MODE, unwrap } from './call';
import { apiError } from './errors';
import {
	guildFromPath,
	locationLabel,
	mapLocation,
	parseDate,
	pickI18n,
	type Location
} from './mappings';
import type { components } from './generated/api';
import type { Guild } from '$lib/types/guild';

type Depends = (dep: `app:cache:${string}`) => void;

type RawBrief = components['schemas']['BriefActivity'];
type RawActivity = components['schemas']['Activity'];
// The list endpoint's gating shape. `TicketKind` is now the single-kind
// detail schema (addons, no window/stock), which this mapper does not read.
type RawTicketKind = components['schemas']['ActivityTicketKind'];
type RawHost = components['schemas']['Host'];
type RawKind = components['schemas']['Kind'];

export type AddonOption = {
	id: string;
	index: number;
	name: string;
	price: number;
};

export type AvailableAddon = {
	id: string;
	name: string;
	multipleAlternatives: boolean;
	hasTextField: boolean;
	required: boolean;
	options: AddonOption[];
};

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
	addons: AvailableAddon[];
};

export type ActivityOrganiser = {
	id: string;
	path: string;
	name: string;
	logoUrl: string;
	/** Known guild theme, when the organiser path maps to one. */
	guild?: Guild;
};

export type ActivityContact = {
	name: string;
	uri: string;
	display: string;
};

/**
 * Activity card / detail shape. Both list and detail endpoints
 * populate everything here; the detail endpoint additionally fills
 * `organisers` from the full `hosts` list. `creatorGuild` is derived
 * from the host matching `creator_id`; components fall back to the
 * default un-themed look when that path has no known guild code.
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
	location: string;
	locationDetails: Location;
	startAt: Date;
	endAt: Date;
	creatorGuild?: Guild;
	/** Responsible contact, available on the full activity response. */
	contact?: ActivityContact;
	/** Creator and co-hosts as returned by the backend. Empty on list
	 *  view (BriefActivity has no hosts), populated by `getActivity`. */
	organisers: ActivityOrganiser[];
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
		ticketsLeft: t.tickets_left ?? undefined,
		addons: []
	};
}

function mapAddon(addon: components['schemas']['AvailableAddon']): AvailableAddon {
	return {
		id: addon.id,
		name: pickI18n(addon.name),
		multipleAlternatives: addon.multiple_alternatives,
		hasTextField: addon.has_text_field,
		required: addon.required,
		options: addon.options.map((option) => ({
			id: option.id,
			index: option.idx,
			name: pickI18n(option.name),
			price: option.price
		}))
	};
}

function withKindDetails(ticketKind: TicketKind, detail: RawKind): TicketKind {
	return { ...ticketKind, addons: detail.available_addons.map(mapAddon) };
}

function mapOrganiser(host: RawHost): ActivityOrganiser {
	return {
		id: host.id,
		path: host.path,
		name: pickI18n(host.name),
		logoUrl: host.logo_url,
		guild: guildFromPath(host.path)
	};
}

function mapBrief(b: RawBrief): Activity {
	const location = mapLocation(b.location);
	return {
		id: b.id,
		image: b.image_url,
		title: pickI18n(b.title),
		description: pickI18n(b.description),
		location: locationLabel(location),
		locationDetails: location,
		startAt: parseDate(b.time_start),
		endAt: parseDate(b.time_end),
		creatorGuild: guildFromPath(b.creator_path),
		contact: undefined,
		organisers: [],
		full: false
	};
}

function mapActivity(a: RawActivity): Activity {
	const creator = a.hosts.find((host) => host.id === a.creator_id) ?? a.hosts[0];
	const location = mapLocation(a.location);
	return {
		id: a.id,
		image: a.image_url,
		title: pickI18n(a.title),
		description: pickI18n(a.description),
		location: locationLabel(location),
		locationDetails: location,
		startAt: parseDate(a.time_start),
		endAt: parseDate(a.time_end),
		creatorGuild: creator ? guildFromPath(creator.path) : undefined,
		contact: {
			name: a.responsible.name,
			uri: a.responsible.contact,
			display: a.responsible.contact.replace(/^(mailto:|tel:)/, '')
		},
		organisers: a.hosts.map(mapOrganiser),
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
	const kinds = raw.map(mapTicketKind);
	if (DEMO_MODE) return kinds;
	return Promise.all(
		kinds.map(async (kind) => {
			const detail = await unwrap(() =>
				api.GET('/tickets/ticket-kind/{id}', { params: { path: { id: kind.id } } })
			);
			return withKindDetails(kind, detail);
		})
	);
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
		image_url: 'https://picsum.photos/seed/home-a/640/360',
		is_hidden: false
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
		image_url: 'https://picsum.photos/seed/home-b/640/360',
		is_hidden: false
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
		image_url: 'https://picsum.photos/seed/home-c/640/360',
		is_hidden: false
	}
];

const _mockActivities: Record<string, RawActivity> = {
	a: {
		id: 'a',
		responsible: { name: 'Simon Mechler', contact: 'mailto:e@example.org' },
		creator_id: '00000000-0000-0000-0000-0000000000a1',
		title: { en: 'Other sitting kinda', sv: 'Annan sittning typ' },
		description: {
			en: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			sv: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
		},
		location: { name: { en: 'Gasque Hall', sv: 'Gasque-salen' } },
		time_start: '2026-04-27T17:00:00Z',
		time_end: '2026-04-27T23:00:00Z',
		image_url: 'https://picsum.photos/seed/home-a/640/360',
		image_id: '00000000-0000-0000-0000-0000000001a1',
		is_hidden: false,
		is_hidden_for_other_admins: false,
		max_tickets: 200,
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
		responsible: { name: 'Simon Mechler', contact: 'mailto:e@example.org' },
		creator_id: '00000000-0000-0000-0000-0000000000d1',
		title: { en: 'Spring fest', sv: 'Vårfest' },
		description: {
			en: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
			sv: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
		},
		location: { name: { en: 'Kårhuset', sv: 'Kårhuset' } },
		time_start: '2026-05-01T21:00:00Z',
		time_end: '2026-05-02T02:00:00Z',
		image_url: 'https://picsum.photos/seed/home-b/640/360',
		image_id: '00000000-0000-0000-0000-0000000001b1',
		is_hidden: false,
		is_hidden_for_other_admins: false,
		max_tickets: 400,
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
		responsible: { name: 'Simon Mechler', contact: 'mailto:e@example.org' },
		creator_id: '00000000-0000-0000-0000-0000000000c1',
		title: { en: 'Tuesday pub', sv: 'Tisdagspub' },
		description: {
			en: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
			sv: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
		},
		location: { name: { en: 'Pub lokal', sv: 'Pub-lokalen' } },
		time_start: '2026-05-05T18:00:00Z',
		time_end: '2026-05-05T23:00:00Z',
		image_url: 'https://picsum.photos/seed/home-c/640/360',
		image_id: '00000000-0000-0000-0000-0000000001c1',
		is_hidden: false,
		is_hidden_for_other_admins: false,
		max_tickets: 100,
		hosts: [
			{
				id: '00000000-0000-0000-0000-0000000000c1',
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
			purchasing_available_stop: '2026-04-27T12:00:00Z'
		},
		{
			id: '00000000-0000-0000-0000-00000000a002',
			name: { en: 'VIP', sv: 'VIP' },
			price: 22000,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-27T12:00:00Z',
			tickets_left: 5
		},
		{
			id: '00000000-0000-0000-0000-00000000a003',
			name: { en: 'Sponsor', sv: 'Sponsor' },
			price: 0,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-27T12:00:00Z'
		}
	],
	b: [
		{
			id: '00000000-0000-0000-0000-00000000b001',
			name: { en: 'Early bird', sv: 'Early bird' },
			price: 8000,
			purchasing_available_start: '2026-04-01T00:00:00Z',
			purchasing_available_stop: '2026-04-15T00:00:00Z'
		},
		{
			id: '00000000-0000-0000-0000-00000000b002',
			name: { en: 'Standard', sv: 'Standard' },
			price: 11000,
			purchasing_available_start: '2026-04-15T00:00:00Z',
			purchasing_available_stop: '2026-05-01T12:00:00Z'
		},
		{
			id: '00000000-0000-0000-0000-00000000b003',
			name: { en: 'After party', sv: 'After party' },
			price: 5000,
			purchasing_available_start: '2026-05-01T00:00:00Z',
			purchasing_available_stop: '2026-05-02T01:00:00Z'
		}
	],
	c: [
		{
			id: '00000000-0000-0000-0000-00000000c001',
			name: { en: 'Entry', sv: 'Entré' },
			price: 4000,
			purchasing_available_start: '2026-05-01T00:00:00Z',
			purchasing_available_stop: '2026-05-05T17:00:00Z'
		},
		{
			id: '00000000-0000-0000-0000-00000000c002',
			name: { en: 'Member', sv: 'Medlem' },
			price: 0,
			purchasing_available_start: '2026-05-01T00:00:00Z',
			purchasing_available_stop: '2026-05-05T17:00:00Z'
		}
	]
};
