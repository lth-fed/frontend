import { invalidate, invalidatePrefix } from '$lib/api/cache';
import { parseDate } from '$lib/api/mappings';
import { serverNow } from '$lib/api/serverClock';
import {
	dropReservation,
	enterQueue,
	leaveQueue,
	listMyTickets,
	queueStatus
} from '$lib/api/tickets';
import { freeGateway, type PaymentGateway } from '$lib/payment/gateway';

/**
 * The purchase state machine (spec §4.1–§4.2). Global — a queue spot or
 * reservation survives navigation (the shell renders a pill for it,
 * §4.5) and app reloads (`restore()` resyncs from the backend).
 *
 * Network discipline (verified against the backend's semantics):
 * - `PUT /tickets/queue` is issued exactly once per attempt — a repeat
 *   PUT after release re-inserts at the BACK of the reservation queue.
 * - No keep-alives: entry is only allowed inside the 10-min window
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
	/** öre */
	price: number;
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
	| { state: 'reserved'; kind: FlowKind; timeout: Date; latestTransaction: Date }
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
/** Faster cadence while a payment is in flight — the server callback is
 *  our only completion signal (spec §4.2). */
const PAYING_POLL_MS = 5_000;
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

function persist(kind: FlowKind, releaseAt?: Date): void {
	try {
		localStorage.setItem(PERSIST_KEY, JSON.stringify({ ...kind, releaseAt }));
	} catch {
		/* storage full/blocked — restore() will degrade gracefully */
	}
}

function readPersisted(): (FlowKind & { releaseAt?: string }) | undefined {
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

/**
 * Enter the queue for a kind (the ONE `PUT` of the attempt). Returns an
 * inline-displayable error message, or `undefined` on success.
 */
export async function joinQueue(kind: FlowKind, releaseAt: Date): Promise<string | undefined> {
	if (purchase.flow.state !== 'idle') return 'another purchase is already in progress';

	const result = await enterQueue(kind.ticketKindId);
	if (result.badRequest) return result.badRequest.message;

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
		// jitter the first poll 0–10 s so a big release doesn't stampede
		schedulePoll(kind, Math.random() * 10_000);
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
		schedulePoll(kind, RESOLUTION_POLL_MS);
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

	if (status === null) {
		// Not queued server-side. Purchased, expired, or lost (B8).
		const tickets = await listMyTickets().catch(() => []);
		if (tickets.some((t) => t.ticketKindId === activeKind.ticketKindId)) {
			invalidate('tickets');
			invalidatePrefix('kinds:');
			clearTimers();
			clearPersisted();
			purchase.flow = { state: 'purchased', kind: activeKind };
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

	if (status.timeout && status.latestTransaction) {
		const wasPaying = flow.state === 'paying';
		if (!wasPaying) {
			purchase.flow = {
				state: 'reserved',
				kind: activeKind,
				timeout: status.timeout,
				latestTransaction: status.latestTransaction
			};
			// just past the hard expiry, one resync flips us to expired/purchased
			if (expiryTimer) clearTimeout(expiryTimer);
			const untilExpiry = status.timeout.getTime() - serverNow().getTime() + 3_000;
			expiryTimer = setTimeout(() => void resync(activeKind), Math.max(0, untilExpiry));

			// Free kinds: nothing to pay — settle immediately through the
			// free gateway (the backend routes free tickets through
			// reservations too, spec §4.4).
			if (activeKind.price === 0) void pay(freeGateway);
		}
		return;
	}

	if (status.placement !== undefined && status.placement > 0) {
		purchase.flow = { state: 'reservation-queued', kind: activeKind, placement: status.placement };
		if (attached && !pollTimer) schedulePoll(activeKind, QUEUE_POLL_MS);
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
 * - completed (free): straight to `purchased`.
 * - submitted (Swish): stay `paying` and poll for the server callback.
 * - failed: the reservation still stands, so fall back to `reserved`
 *   (countdown intact) and return the message for inline display —
 *   krav §6's "show the error, allow retry within the window".
 * Returns an optional error message for the caller to surface.
 */
export async function pay(gateway: PaymentGateway): Promise<{ error?: string }> {
	const flow = purchase.flow;
	if (flow.state !== 'reserved') return {};
	const { kind, timeout, latestTransaction } = flow;
	purchase.flow = { state: 'paying', kind, timeout };

	const outcome = await gateway.pay(kind.ticketKindId);

	if (outcome.kind === 'completed') {
		invalidate('tickets');
		invalidatePrefix('kinds:');
		clearTimers();
		clearPersisted();
		purchase.flow = { state: 'purchased', kind };
		return {};
	}
	if (outcome.kind === 'submitted') {
		schedulePoll(kind, PAYING_POLL_MS);
		return {};
	}
	// failed. Transient (5xx/network): the reservation still stands, so
	// return to `reserved` with the countdown intact and surface the
	// message inline for a retry (krav §6).
	if (outcome.retriable) {
		purchase.flow = { state: 'reserved', kind, timeout, latestTransaction };
		return { error: outcome.message };
	}
	// Permanent (business rule — already own a ticket / not allowed):
	// retrying is pointless and the seat is wasted, so release the
	// reservation and land in a terminal `failed` state the user can only
	// dismiss. No dead-end with a forever-failing Pay button.
	void dropReservation();
	clearTimers();
	clearPersisted();
	purchase.flow = { state: 'failed', kind, message: outcome.message };
	return {};
}

/** Rebuild state after an app reload (called post-auth from the root
 *  layout). No-op when nothing is queued server-side. */
export async function restore(): Promise<void> {
	if (purchase.flow.state !== 'idle') return;
	const persisted = readPersisted();
	const status = await queueStatus();
	if (status === null) {
		clearPersisted();
		return;
	}
	const kind: FlowKind =
		persisted && persisted.ticketKindId === status.ticketKindId
			? persisted
			: // spot exists but we lost the metadata (other device?) —
				// degrade: unknown activity (pill navigates Home) and UNKNOWN
				// price: NaN never equals 0, so the free-purchase auto-complete
				// can't fire on a paid reservation we know nothing about
				{ ticketKindId: status.ticketKindId, activityId: '', name: '', price: Number.NaN };
	await resync(kind);
}

/** The purchase screen for the active kind became visible/hidden. */
export function setAttached(value: boolean): void {
	attached = value;
	const flow = purchase.flow;
	if (value && (flow.state === 'reservation-queued' || flow.state === 'resolving')) {
		void resync();
	}
	if (!value && flow.state === 'reservation-queued' && pollTimer) {
		clearTimeout(pollTimer);
		pollTimer = undefined;
	}
}

/** Cancel whatever is active. Reservation-queue spots have no leave
 *  endpoint (spec ask B13) — those are abandoned locally. */
export async function cancel(): Promise<void> {
	const flow = purchase.flow;
	switch (flow.state) {
		case 'release-queued':
		case 'resolving':
			await leaveQueue();
			break;
		case 'reserved': {
			const result = await dropReservation();
			if (result === 'TransactionCancelling') {
				purchase.flow = { state: 'paying', kind: flow.kind, timeout: flow.timeout };
				schedulePoll(flow.kind, PAYING_POLL_MS);
				return;
			}
			invalidatePrefix('kinds:');
			break;
		}
		case 'reservation-queued':
			// no endpoint — local abandon; the server spot lapses on its own
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
