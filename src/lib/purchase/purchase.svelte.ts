import { evict, evictPrefix, invalidatePrefix } from '$lib/api/cache';
import { parseDate } from '$lib/api/mappings';
import { serverNow } from '$lib/api/serverClock';
import {
	enterQueue,
	getTicketKindPurchaseContext,
	leaveQueue,
	listMyTickets,
	queueStatus,
	type TicketKindPurchaseContext
} from '$lib/api/tickets';
import type { PaymentGateway } from '$lib/payment/gateway';
import { m } from '$lib/paraglide/messages.js';

/**
 * The purchase state machine (spec §4.1–§4.2). Global — a queue spot or
 * reservation survives navigation (the shell renders a pill for it,
 * §4.5) and app reloads (`restore()` resyncs from the backend).
 *
 * Network discipline (verified against the backend's semantics):
 * - `PUT /tickets/queue` is issued exactly once per attempt — a repeat
 *   PUT after release re-inserts at the BACK of the reservation queue.
 * - No keep-alives: entry is only allowed inside the 15-min window
 *   (§4.6), so a spot can't purge (20 min) before release.
 * - Polling only where the server can have news: a bounded resolution
 *   loop around the release lottery, a 15 s loop while
 *   reservation-queued (only while the purchase screen is attached),
 *   and an expiry check just past a reservation's timeout. All timer
 *   math uses `serverNow()` against absolute server timestamps.
 */

export type FlowKind = {
	ticketKindId: string;
	activityId: string;
	name: string;
	/** Calculated from the base ticket and, once configured, selected add-on prices. */
	requiresPayment: boolean;
	addons?: { id: string; selectedOptions?: number[]; selectedText?: string }[];
};

export type PurchaseFlow =
	| { state: 'idle' }
	/** Waiting for the release moment (pre-release). */
	| { state: 'release-queued'; kind: FlowKind; releaseAt: Date }
	/** Release moment passed — awaiting the server-side lottery outcome. */
	| { state: 'resolving'; kind: FlowKind }
	/** Released, no seat yet; `placement` people ahead. */
	| { state: 'reservation-queued'; kind: FlowKind; placement: number }
	/** Seat held. Pay before `latestTransaction`; gone at `timeout`. */
	| {
			state: 'reserved';
			kind: FlowKind;
			timeout: Date;
			latestTransaction: Date;
			paymentRequired?: boolean;
	  }
	/** Payment in flight (step 5 — gateway lands here). */
	| { state: 'paying'; kind: FlowKind; timeout: Date }
	/** Terminal-ish states; `acknowledge()` returns to idle. */
	| { state: 'purchased'; kind: FlowKind }
	| { state: 'expired'; kind: FlowKind }
	| { state: 'delayed'; kind: FlowKind }
	| { state: 'failed'; kind: FlowKind; message?: string };

export const purchase = $state<{ flow: PurchaseFlow }>({ flow: { state: 'idle' } });

const PERSIST_KEY = 'tappen-purchase-flow';
const RESOLUTION_POLL_MS = 15_000;
const FIRST_RELEASE_POLL_MIN_MS = 5_000;
const FIRST_RELEASE_POLL_JITTER_MS = 10_000;
const PURCHASE_FLOW_RETRY_MS = 3_000;
/** Faster cadence while a payment is in flight — the server callback is
 *  our only completion signal (spec §4.2). */
const PAYING_POLL_MS = 5_000;
const PAYMENT_CONFIRMATION_GRACE_MS = 60_000;
const RESOLUTION_GIVE_UP_MS = 3 * 60_000;
const QUEUE_POLL_MS = 15_000;

type Timer = ReturnType<typeof setTimeout>;
let releaseTimer: Timer | undefined;
let pollTimer: Timer | undefined;
let expiryTimer: Timer | undefined;
let resolutionStartedAt: number | undefined;
/** The purchase screen for the active kind is visible (drives the
 *  reservation-queued poll — nothing polls while the user is away). */
let attached = false;

function clearTimers(): void {
	for (const t of [releaseTimer, pollTimer, expiryTimer]) if (t) clearTimeout(t);
	releaseTimer = pollTimer = expiryTimer = undefined;
	resolutionStartedAt = undefined;
}

function persist(
	kind: FlowKind,
	releaseAt?: Date,
	payment?: { submitted: true; timeout: Date }
): void {
	try {
		localStorage.setItem(
			PERSIST_KEY,
			JSON.stringify({
				...kind,
				releaseAt,
				paymentSubmitted: payment?.submitted,
				paymentTimeout: payment?.timeout
			})
		);
	} catch {
		/* storage full/blocked — restore() will degrade gracefully */
	}
}

type PersistedFlow = FlowKind & {
	releaseAt?: string;
	paymentSubmitted?: boolean;
	paymentTimeout?: string;
};

function readPersisted(): PersistedFlow | undefined {
	try {
		const raw = localStorage.getItem(PERSIST_KEY);
		return raw ? JSON.parse(raw) : undefined;
	} catch {
		return undefined;
	}
}

function clearPersisted(): void {
	try {
		localStorage.removeItem(PERSIST_KEY);
	} catch {
		/* ignore */
	}
}

function toIdle(): void {
	clearTimers();
	clearPersisted();
	purchase.flow = { state: 'idle' };
}

function completePurchase(kind: FlowKind): void {
	// Home must cold-load the just-purchased ticket. Serving the stale persistent
	// ticket list here also scheduled a SvelteKit invalidation which could cancel
	// the simultaneous navigation away from the purchase page.
	evict('tickets', 'purchased-tickets');
	evictPrefix('kinds:');
	clearTimers();
	clearPersisted();
	purchase.flow = { state: 'purchased', kind };
}

/**
 * Enter the queue for a kind (the ONE `PUT` of the attempt). Returns an
 * inline-displayable error message, or `undefined` on success.
 */
export async function joinQueue(kind: FlowKind, releaseAt: Date): Promise<string | undefined> {
	if (purchase.flow.state !== 'idle') return m.queue_another_purchase();

	const result = await enterQueue(kind.ticketKindId);
	if (result.badRequest) {
		return result.badRequest.field === 'ticket_kind_id'
			? m.purchase_sold_out()
			: result.badRequest.message;
	}

	persist(kind, releaseAt);
	switch (result.ok) {
		case 'ReleaseQueued': {
			purchase.flow = { state: 'release-queued', kind, releaseAt };
			scheduleReleaseWake(kind, releaseAt);
			return undefined;
		}
		case 'Reserved':
		case 'ReservationQueued': {
			// The PUT response carries no timestamps — one GET fills them in.
			await resync(kind);
			return undefined;
		}
		default: {
			await resync(kind);
			return undefined;
		}
	}
}

function scheduleReleaseWake(kind: FlowKind, releaseAt: Date): void {
	const delay = Math.max(0, releaseAt.getTime() - serverNow().getTime());
	releaseTimer = setTimeout(() => {
		purchase.flow = { state: 'resolving', kind };
		resolutionStartedAt = Date.now();
		// Wait 5–15 s after release so a big release doesn't stampede the backend.
		schedulePoll(kind, FIRST_RELEASE_POLL_MIN_MS + Math.random() * FIRST_RELEASE_POLL_JITTER_MS);
	}, delay);
}

function schedulePoll(kind: FlowKind, delay: number): void {
	if (pollTimer) clearTimeout(pollTimer);
	pollTimer = setTimeout(() => void poll(kind), delay);
}

async function poll(kind: FlowKind): Promise<void> {
	if (document.hidden) {
		// backgrounded tab: skip the request, try again next interval —
		// resume()/attach() fire an immediate resync anyway
		schedulePoll(kind, purchase.flow.state === 'paying' ? PAYING_POLL_MS : RESOLUTION_POLL_MS);
		return;
	}
	await resync(kind);
	const { state } = purchase.flow;
	if (state === 'resolving') {
		if (resolutionStartedAt && Date.now() - resolutionStartedAt > RESOLUTION_GIVE_UP_MS) {
			// the lottery never ran (backend B8/B9) — manual refresh territory
			purchase.flow = { state: 'delayed', kind };
			return;
		}
		schedulePoll(kind, RESOLUTION_POLL_MS);
	} else if (state === 'reservation-queued' && attached) {
		schedulePoll(kind, QUEUE_POLL_MS);
	} else if (state === 'paying') {
		// Swish confirms asynchronously. Keep checking until the queue
		// disappears instead of stopping after the first `Buying` response.
		schedulePoll(kind, PAYING_POLL_MS);
	}
}

/**
 * One GET, mapped onto the machine. Safe to call any time; used by the
 * poll loops, screen attach, app resume and `restore()`.
 */
export async function resync(kind?: FlowKind): Promise<void> {
	const flow = purchase.flow;
	const activeKind = kind ?? ('kind' in flow ? flow.kind : undefined);
	if (!activeKind) return;

	const status = await queueStatus();

	if (status.kind === 'retry') {
		// Unexpected/network responses never collapse into a terminal state.
		// Retry at the deliberate 5 s recovery cadence.
		schedulePoll(activeKind, PAYING_POLL_MS);
		return;
	}

	if (status.kind === 'missing') {
		// Not queued server-side. Purchased, expired, or lost (B8). A Swish
		// return may beat the server callback, so confirm against the ticket
		// list instead of treating the first 404 as completed.
		if (flow.state === 'paying') {
			let tickets;
			try {
				tickets = await listMyTickets();
			} catch (error) {
				console.warn('Could not confirm completed purchase yet', error);
				schedulePoll(activeKind, PAYING_POLL_MS);
				return;
			}
			if (tickets.some((ticket) => ticket.ticketKindId === activeKind.ticketKindId)) {
				completePurchase(activeKind);
			} else if (serverNow().getTime() > flow.timeout.getTime() + PAYMENT_CONFIRMATION_GRACE_MS) {
				clearTimers();
				clearPersisted();
				purchase.flow = { state: 'failed', kind: activeKind, message: undefined };
			} else {
				schedulePoll(activeKind, PAYING_POLL_MS);
			}
			return;
		}
		if (flow.state === 'reservation-queued') {
			// A reservation-queue entry cannot turn into a purchase without first
			// becoming a held reservation. If it disappears, no capacity remains.
			clearTimers();
			clearPersisted();
			purchase.flow = { state: 'failed', kind: activeKind, message: m.purchase_sold_out() };
			return;
		}
		let tickets;
		try {
			tickets = await listMyTickets();
		} catch (error) {
			console.warn('Could not confirm completed purchase yet', error);
			schedulePoll(activeKind, PAYING_POLL_MS);
			return;
		}
		if (tickets.some((t) => t.ticketKindId === activeKind.ticketKindId)) {
			completePurchase(activeKind);
		} else if (flow.state === 'reserved' && serverNow() >= flow.timeout) {
			clearTimers();
			clearPersisted();
			purchase.flow = { state: 'expired', kind: activeKind };
		} else if (flow.state === 'idle') {
			toIdle();
		} else {
			clearTimers();
			clearPersisted();
			purchase.flow = { state: 'failed', kind: activeKind, message: undefined };
		}
		return;
	}
	const current = status.status;

	if (current.timeout && current.latestTransaction) {
		const wasPaying = flow.state === 'paying';
		const paymentRequired =
			activeKind.requiresPayment || (flow.state === 'reserved' && flow.paymentRequired);
		if (!wasPaying) {
			purchase.flow = {
				state: 'reserved',
				kind: activeKind,
				timeout: current.timeout,
				latestTransaction: current.latestTransaction,
				paymentRequired
			};
			// just past the hard expiry, one resync flips us to expired/purchased
			if (expiryTimer) clearTimeout(expiryTimer);
			const untilExpiry = current.timeout.getTime() - serverNow().getTime() + 3_000;
			expiryTimer = setTimeout(() => void resync(activeKind), Math.max(0, untilExpiry));
		}
		return;
	}

	if (current.placement !== undefined && current.placement > 0) {
		purchase.flow = { state: 'reservation-queued', kind: activeKind, placement: current.placement };
		if (attached && !pollTimer) schedulePoll(activeKind, QUEUE_POLL_MS);
		return;
	}

	if (current.placement === 0) {
		// Contract says a held reservation always includes both deadlines.
		// Treat a partial response as transient instead of inventing state.
		schedulePoll(activeKind, PAYING_POLL_MS);
		return;
	}

	// placement missing → still pre-release on the server
	if (flow.state !== 'resolving' && flow.state !== 'release-queued') {
		const persisted = readPersisted();
		const releaseAt = persisted?.releaseAt ? parseDate(persisted.releaseAt) : undefined;
		if (releaseAt && releaseAt.getTime() > serverNow().getTime()) {
			purchase.flow = { state: 'release-queued', kind: activeKind, releaseAt };
			scheduleReleaseWake(activeKind, releaseAt);
		} else {
			purchase.flow = { state: 'resolving', kind: activeKind };
			resolutionStartedAt ??= Date.now();
			schedulePoll(activeKind, RESOLUTION_POLL_MS);
		}
	}
}

/**
 * Collect payment for the held reservation via `gateway` (spec §4.4).
 * `reserved` → `paying`; then `completed`/`submitted`/`failed`:
 * - submitted: stay `paying` and poll for the server-side confirmation.
 * - busy (403): retry after a short delay, bounded by `latestTransaction`.
 * - failed: the reservation still stands, so fall back to `reserved`
 *   (countdown intact) and return the message for inline display —
 *   krav §6's "show the error, allow retry within the window".
 * Returns an optional error message for the caller to surface.
 */
export async function pay(gateway: PaymentGateway): Promise<{ error?: string }> {
	const flow = purchase.flow;
	if (flow.state !== 'reserved') return {};
	const { kind, timeout, latestTransaction, paymentRequired } = flow;
	purchase.flow = { state: 'paying', kind, timeout };
	persist(kind, undefined, { submitted: true, timeout });

	let outcome = await gateway.pay({ ticketKindId: kind.ticketKindId, addons: kind.addons });
	while (outcome.kind === 'busy') {
		if (purchase.flow.state !== 'paying' || purchase.flow.kind.ticketKindId !== kind.ticketKindId) {
			return {};
		}
		if (serverNow().getTime() + PURCHASE_FLOW_RETRY_MS >= latestTransaction.getTime()) {
			persist(kind);
			purchase.flow = { state: 'reserved', kind, timeout, latestTransaction, paymentRequired };
			return { error: m.queue_pay_too_late() };
		}
		await new Promise((resolve) => setTimeout(resolve, PURCHASE_FLOW_RETRY_MS));
		if (purchase.flow.state !== 'paying' || purchase.flow.kind.ticketKindId !== kind.ticketKindId) {
			return {};
		}
		outcome = await gateway.pay({ ticketKindId: kind.ticketKindId, addons: kind.addons });
	}

	if (outcome.kind === 'submitted') {
		// Check once immediately; the normal recovery cadence starts after that.
		schedulePoll(kind, 0);
		return {};
	}
	// failed. Transient (5xx/network): the reservation still stands, so
	// return to `reserved` with the countdown intact and surface the
	// message inline for a retry (krav §6).
	if (outcome.retriable) {
		persist(kind);
		purchase.flow = { state: 'reserved', kind, timeout, latestTransaction, paymentRequired };
		return { error: outcome.message };
	}
	// Permanent business-rule errors cannot succeed on retry.
	clearTimers();
	clearPersisted();
	purchase.flow = { state: 'failed', kind, message: outcome.message };
	return {};
}

/** Attach add-on choices only after capacity has been reserved, immediately before payment. */
export function configurePurchase(
	addons: NonNullable<FlowKind['addons']>,
	requiresPayment: boolean
): void {
	const flow = purchase.flow;
	if (flow.state !== 'reserved') return;
	const kind = { ...flow.kind, addons, requiresPayment };
	persist(kind);
	purchase.flow = { ...flow, kind, paymentRequired: requiresPayment };
}

/** Rebuild state after an app reload (called post-auth from the root
 *  layout). No-op when nothing is queued server-side. */
export async function restore(): Promise<void> {
	if (purchase.flow.state !== 'idle') return;
	const persisted = readPersisted();
	const status = await queueStatus();
	if (status.kind === 'retry') return;
	if (status.kind === 'missing') {
		if (
			persisted?.paymentSubmitted &&
			persisted.activityId &&
			persisted.name &&
			typeof persisted.requiresPayment === 'boolean' &&
			persisted.paymentTimeout
		) {
			purchase.flow = {
				state: 'paying',
				kind: persisted,
				timeout: parseDate(persisted.paymentTimeout)
			};
			schedulePoll(persisted, 0);
			return;
		}
		clearPersisted();
		return;
	}
	const persistedForKind =
		persisted?.ticketKindId === status.status.ticketKindId ? persisted : undefined;
	let kind: FlowKind;
	if (
		persistedForKind?.activityId &&
		persistedForKind.name &&
		typeof persistedForKind.requiresPayment === 'boolean'
	) {
		kind = persistedForKind;
	} else {
		try {
			const context = await getTicketKindPurchaseContext(status.status.ticketKindId);
			kind = restoredKind(context, status.status.ticketKindId, persistedForKind?.addons);
			persist(kind);
		} catch (error) {
			console.warn('Could not recover reservation details yet', error);
			return;
		}
	}
	if (persistedForKind?.paymentSubmitted && status.status.timeout) {
		purchase.flow = {
			state: 'paying',
			kind,
			timeout: status.status.timeout
		};
		schedulePoll(kind, PAYING_POLL_MS);
		return;
	}
	await resync(kind);
}

function restoredKind(
	context: TicketKindPurchaseContext,
	ticketKindId: string,
	addons?: FlowKind['addons']
): FlowKind {
	const addonPrice = (addons ?? []).reduce((total, selection) => {
		const prices = context.addonOptions.find((addon) => addon.addonId === selection.id)?.options;
		return (
			total +
			(selection.selectedOptions ?? []).reduce(
				(sum, index) => sum + (prices?.find((option) => option.index === index)?.price ?? 0),
				0
			)
		);
	}, 0);
	return {
		ticketKindId,
		activityId: context.activityId,
		name: context.name,
		requiresPayment: context.basePrice + addonPrice !== 0,
		addons
	};
}

/** The purchase screen for the active kind became visible/hidden. */
export function setAttached(value: boolean): void {
	attached = value;
	const flow = purchase.flow;
	if (
		value &&
		(flow.state === 'reservation-queued' || flow.state === 'resolving' || flow.state === 'reserved')
	) {
		void resync();
	}
	if (!value && flow.state === 'reservation-queued' && pollTimer) {
		clearTimeout(pollTimer);
		pollTimer = undefined;
	}
}

/** Cancel the active queue or reservation on the server before clearing local state. */
export async function cancel(): Promise<void> {
	const flow = purchase.flow;
	switch (flow.state) {
		case 'release-queued':
		case 'resolving':
		case 'reservation-queued':
		case 'delayed':
			await leaveQueue();
			break;
		case 'reserved':
			await leaveQueue();
			invalidatePrefix('kinds:');
			break;
		default:
			break;
	}
	toIdle();
}

/** Leave a terminal state (purchased/expired/delayed/failed) → idle. */
export function acknowledge(): void {
	if (
		purchase.flow.state === 'purchased' ||
		purchase.flow.state === 'expired' ||
		purchase.flow.state === 'delayed' ||
		purchase.flow.state === 'failed'
	) {
		toIdle();
	}
}

/** App came back to the foreground — one immediate resync (spec §4.2). */
export function onResume(): void {
	if (purchase.flow.state !== 'idle') void resync();
}
