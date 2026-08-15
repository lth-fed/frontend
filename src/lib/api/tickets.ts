import { api } from './clients';
import { cached, cachedPersistent, invalidate } from './cache';
import { attempt, DEMO_MODE, unwrap, type Attempt } from './call';
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

type RawTicket = components['schemas']['PurchasedTicket'];
type RawAddon = components['schemas']['PurchasedAddon'];

export type PurchasedAddon = {
	id: string;
	name: string;
	multipleAlternatives: boolean;
	hasTextField: boolean;
	required: boolean;
	selectedOptions: number[];
	selectedText: string;
};

/** Prop names match the `<Ticket>` card component so a load function
 *  can `<Ticket {...ticket} name={…} />` without a wrapper. Field names
 *  intentionally pluralise the backend's snake_case. */
export type Ticket = {
	id: string;
	ticketKindId: string;
	activityId: string;
	ticketKindName: string;
	activityTitle: string;
	creatorName: string;
	creatorGuild?: Guild;
	location: string;
	locationDetails: Location;
	timeStart: Date;
	timeEnd: Date;
	addons: PurchasedAddon[];
};

export type PurchaseProvider = 'free' | 'swish' | 'stripe';
export type ReservationPurchase = {
	ticketKindId: string;
	/** Selected add-ons included in the reservation purchase. */
	addons?: { id: string; selectedOptions?: number[]; selectedText?: string }[];
};
export type BuyReservationInput = ReservationPurchase &
	(
		| { provider: 'stripe'; stripeSuccessUrl: string }
		| { provider: Exclude<PurchaseProvider, 'stripe'>; stripeSuccessUrl?: never }
	);
export type BuyReservationOutcome = {
	/** Set for `swish` — opens the Swish app (step 5 gateway). */
	paymentRequestToken?: string;
	/** Set for Stripe — must be opened in a separate browser context. */
	stripeUrl?: string;
};

function mapAddon(a: RawAddon): PurchasedAddon {
	return {
		id: a.id,
		name: pickI18n(a.name),
		multipleAlternatives: a.multiple_alternatives,
		hasTextField: a.has_text_field,
		required: a.required,
		selectedOptions: a.selected_options,
		selectedText: a.selected_text
	};
}

function mapTicket(t: RawTicket): Ticket {
	const location = mapLocation(t.activity_location);
	return {
		id: t.id,
		ticketKindId: t.ticket_kind_id,
		activityId: t.activity_id,
		ticketKindName: pickI18n(t.ticket_kind_name),
		activityTitle: pickI18n(t.activity_title),
		creatorName: pickI18n(t.creator_name),
		creatorGuild: guildFromPath(t.creator_path),
		location: locationLabel(location),
		locationDetails: location,
		timeStart: parseDate(t.time_start),
		timeEnd: parseDate(t.time_end),
		addons: t.purchased_addons.map(mapAddon)
	};
}

/** List the signed-in user's purchased tickets. Spread directly onto
 *  `<Ticket {...ticket} name={…} />` — the component formats dates,
 *  derives the serial display string, etc. */
export async function listMyTickets(): Promise<Ticket[]> {
	const raw = DEMO_MODE ? _mockTickets : await unwrap(() => api.GET('/tickets', {}));
	return raw.filter((ticket) => ticket.owned_by_me).map(mapTicket);
}

/** Complete purchase history, including tickets that have since been transferred. */
export async function listPurchasedTickets(): Promise<Ticket[]> {
	const raw = DEMO_MODE ? _mockTickets : await unwrap(() => api.GET('/tickets', {}));
	return raw.map(mapTicket);
}

/** Cached tickets list (spec §3.3: 60 s stale-while-revalidate;
 *  invalidated by purchases and app resume). */
export function cachedMyTickets(depends?: Depends): Promise<Ticket[]> {
	return cachedPersistent(
		'tickets',
		60_000,
		listMyTickets,
		(value) =>
			(value as Ticket[]).map((ticket) => ({
				...ticket,
				timeStart: new Date(ticket.timeStart),
				timeEnd: new Date(ticket.timeEnd)
			})),
		depends
	);
}

export function cachedPurchasedTickets(depends?: Depends): Promise<Ticket[]> {
	return cached('purchased-tickets', 60_000, listPurchasedTickets, depends);
}

/**
 * Buy the currently held reservation (all purchases go through a
 * reservation on this backend — free tickets included). 400s come back
 * as `badRequest` for inline rendering (spec §7). On a completed free
 * purchase the tickets and ticket-kind caches are invalidated.
 */
export async function buyReservation(
	input: BuyReservationInput
): Promise<Attempt<BuyReservationOutcome>> {
	if (DEMO_MODE) return { ok: {} };
	const result = await attempt<components['schemas']['BuyTicketResponse']>(() =>
		api.POST('/tickets/reservation/buy', {
			body: {
				ticket_kind: input.ticketKindId,
				provider: input.provider,
				addons: (input.addons ?? []).map((a) => ({
					id: a.id,
					selected_options: a.selectedOptions,
					selected_text: a.selectedText
				})),
				stripe_success_url: input.stripeSuccessUrl
			}
		})
	);
	if (result.badRequest) return result;
	return {
		ok: {
			paymentRequestToken: result.ok.payment_request_token ?? undefined,
			stripeUrl: result.ok.stripe_url ?? undefined
		}
	};
}

/** Download the PDF receipt using the authenticated API transport. */
export async function receiptBlob(ticketId: string): Promise<Blob> {
	const data = await unwrap(() =>
		api.GET('/tickets/{id}/receipt', {
			params: { path: { id: ticketId } },
			headers: { accept: 'application/octet-stream' },
			parseAs: 'blob'
		})
	);
	return new Blob([data], { type: 'application/pdf' });
}

export async function transferTicket(ticketId: string, toUser: string): Promise<void> {
	await unwrap(() =>
		api.POST('/tickets/transfer', {
			body: { purchased_ticket_id: ticketId, to_user: toUser }
		})
	);
	invalidate('tickets', 'purchased-tickets');
}

// ---------------------------------------------------------------------------
// Queue / reservation endpoints (spec §4.2). Contract: erik/transactions.
// Never cached — the purchase machine (`$lib/purchase`) owns all polling and
// is the only caller. A repeat PUT after release resets queue placement, so
// `enterQueue` must be called exactly once per attempt.
// ---------------------------------------------------------------------------

export type PurchaseStatus =
	'ReleaseQueued' | 'ReservationQueued' | 'Reserved' | 'Buying' | 'Purchased';

export type QueueStatus = {
	ticketKindId: string;
	/** 0 = you hold a reservation; >0 = people ahead of you; undefined =
	 *  release hasn't happened yet. */
	placement?: number;
	/** Reservation expiry (absolute, server clock). */
	timeout?: Date;
	/** Last moment a transaction may start (= timeout − 1 min). */
	latestTransaction?: Date;
};

/** Enter the queue for a ticket kind (single call per attempt!). */
export async function enterQueue(ticketKindId: string): Promise<Attempt<PurchaseStatus>> {
	return attempt<PurchaseStatus>(() =>
		api.PUT('/tickets/queue', { body: { ticket_kind: ticketKindId } })
	);
}

/** Poll queue/reservation state. `null` = not queued at all (a 404 by
 *  contract — also the post-purchase/post-expiry signal, spec §4.2). */
export type QueueStatusResult =
	{ kind: 'status'; status: QueueStatus } | { kind: 'missing' } | { kind: 'retry' };

export async function queueStatus(): Promise<QueueStatusResult> {
	let result;
	try {
		result = await api.GET('/tickets/queue', {});
	} catch (error) {
		console.warn('queue status temporarily unavailable', error);
		return { kind: 'retry' };
	}
	const { data, error, response } = result;
	if (response.status === 404) return { kind: 'missing' };
	if (!response.ok || !data) {
		console.warn('queue status temporarily unavailable', response.status, error);
		return { kind: 'retry' };
	}
	return {
		kind: 'status',
		status: {
			ticketKindId: data.ticket_kind,
			placement: data.placement ?? undefined,
			timeout: data.timeout ? parseDate(data.timeout) : undefined,
			latestTransaction: data.start_transaction_before
				? parseDate(data.start_transaction_before)
				: undefined
		}
	};
}

/** Leave the release queue (pre-release cancel). 404 = wasn't queued. */
export async function leaveQueue(): Promise<void> {
	const { response } = await api.DELETE('/tickets/queue', {});
	if (!response.ok && response.status !== 404) console.error('leave queue failed', response.status);
}

const _mockTickets: RawTicket[] = [
	{
		id: '00000000-0000-0000-0000-000000000100',
		ticket_kind_id: '00000000-0000-0000-0000-00000000b002',
		activity_id: 'b',
		ticket_kind_name: { en: 'Standard', sv: 'Standard' },
		activity_title: { en: 'Spring fest', sv: 'Vårfest' },
		activity_location: { name: { en: 'Kårhuset', sv: 'Kårhuset' } },
		creator_id: '00000000-0000-0000-0000-0000000000d1',
		creator_path: 'tlth.d',
		creator_name: { en: 'D-sektionen', sv: 'D-sektionen' },
		time_start: '2026-05-01T21:00:00Z',
		time_end: '2026-05-02T02:00:00Z',
		purchased_addons: [],
		owned_by_me: true
	}
];
