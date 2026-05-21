import type { Guild } from '$lib/types/guild';
import type { ApiCallOpts } from './clients';
import { apiError } from './errors';

export type TicketKind = {
	id: string;
	name: string;
	/** Price in SEK. 0 means free. */
	price: number;
};

export type Activity = {
	id: string;
	image: string;
	badge: string;
	title: string;
	description: string;
	location: string;
	startAt: Date;
	endAt: Date;
	priceFrom?: number;
	organisers: Guild[];
	ticketKinds: TicketKind[];
};

/**
 * List all activities visible to the current user.
 *
 * Backed by mock data while the backend `/activities` endpoint is pending.
 * The real-call body will wrap the openapi-fetch call through `unwrap`
 * from `./errors`; the signature here is stable across the swap.
 */
export async function listActivities(_opts: ApiCallOpts = {}): Promise<Activity[]> {
	return Object.values(_mock);
}

/**
 * Fetch a single activity by id. Throws a SvelteKit 404 via `apiError`
 * if the id is unknown; any other failure throws the matching kind.
 * Route loaders need no translation — the framework renders the right
 * error page directly.
 */
export async function getActivity(id: string, _opts: ApiCallOpts = {}): Promise<Activity> {
	const found = _mock[id];
	if (!found) apiError('not-found', `Activity "${id}" not found`);
	return found;
}

const _mock: Record<string, Activity> = {
	a: {
		id: 'a',
		image: 'https://picsum.photos/seed/home-a/640/360',
		badge: 'SITTNING',
		title: 'Annan sittning typ',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex.',
		location: 'Gasque-salen',
		startAt: new Date('2026-04-27T17:00'),
		endAt: new Date('2026-04-27T23:00'),
		priceFrom: 120,
		organisers: ['f'],
		ticketKinds: [
			{ id: 'standard', name: 'Standard', price: 120 },
			{ id: 'vip', name: 'VIP', price: 220 },
			{ id: 'sponsor', name: 'Sponsor', price: 0 }
		]
	},
	b: {
		id: 'b',
		image: 'https://picsum.photos/seed/home-b/640/360',
		badge: 'SITTNING',
		title: 'Vårfest',
		description:
			'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.',
		location: 'Kårhuset',
		startAt: new Date('2026-05-01T21:00'),
		endAt: new Date('2026-05-02T02:00'),
		priceFrom: 80,
		organisers: ['f', 'e', 'm', 'v', 'a', 'k', 'd', 'ing', 'w', 'i'],
		ticketKinds: [
			{ id: 'early-bird', name: 'Early bird', price: 80 },
			{ id: 'standard', name: 'Standard', price: 110 },
			{ id: 'after-party', name: 'After party', price: 50 }
		]
	},
	c: {
		id: 'c',
		image: 'https://picsum.photos/seed/home-c/640/360',
		badge: 'PUB',
		title: 'Tisdagspub',
		description:
			'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
		location: 'Pub-lokalen',
		startAt: new Date('2026-05-05T18:00'),
		endAt: new Date('2026-05-05T23:00'),
		priceFrom: 40,
		organisers: ['f'],
		ticketKinds: [
			{ id: 'entry', name: 'Entré', price: 40 },
			{ id: 'member', name: 'Medlem', price: 0 }
		]
	}
};
