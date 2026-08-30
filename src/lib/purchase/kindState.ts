import type { TicketKind } from '$lib/api/activities';

/** How close to release queue entry opens (spec §4.2): joining earlier
 *  is pointless (the release is a lottery) and would let the spot purge
 *  before release (20-min backend purge vs ≤15-min wait). */
export const ENTRY_WINDOW_MS = 15 * 60 * 1000;

/**
 * Purchasability of a ticket kind at `now` (pass `serverNow()`).
 * Priority: membership > closed > pre-release > stock.
 */
export type KindState =
	| { state: 'closed' }
	/** Before the entry window opens. */
	| { state: 'not-yet'; releaseAt: Date }
	/** Within 15 min of release — queue entry allowed (step 4 CTA). */
	| { state: 'window'; releaseAt: Date }
	/** Released with no remaining capacity. */
	| { state: 'sold-out' }
	/** Purchasable. `ticketsLeft` is set only when the backend flags
	 *  scarcity (< 10 left). */
	| { state: 'open'; ticketsLeft?: number };

export function deriveKindState(kind: TicketKind, now: Date): KindState {
	if (now >= kind.purchasingAvailableStop) {
		return kind.ticketsLeft === 0 ? { state: 'sold-out' } : { state: 'closed' };
	}
	if (now < kind.purchasingAvailableStart) {
		const untilRelease = kind.purchasingAvailableStart.getTime() - now.getTime();
		return untilRelease <= ENTRY_WINDOW_MS
			? { state: 'window', releaseAt: kind.purchasingAvailableStart }
			: { state: 'not-yet', releaseAt: kind.purchasingAvailableStart };
	}
	if (kind.ticketsLeft === 0) return { state: 'sold-out' };
	return { state: 'open', ticketsLeft: kind.ticketsLeft };
}
