import { Capacitor } from '@capacitor/core';
import { buyReservation, type PurchaseProvider } from '$lib/api';

/**
 * Payment seam (spec §4.4). The purchase machine holds a reservation
 * and asks a gateway to collect payment; the gateway owns the
 * provider-specific mechanics (server call + native app hand-off) and
 * nothing else. Swapping providers — or dropping in Stripe later — is a
 * new `PaymentGateway`, no machine changes.
 *
 * `pay()` initiates; it does NOT wait for money to arrive. Swish
 * confirmation comes server-to-server (transactions → minilith
 * callback), so the machine polls the queue endpoint after `submitted`
 * (spec §4.2). Free tickets settle inline and return `completed`.
 */

export type PaymentOutcome =
	/** Settled immediately (free tickets) — ticket now exists. */
	| { kind: 'completed'; ticketId?: string }
	/** Initiated; the machine polls for the server-side confirmation. */
	| { kind: 'submitted' }
	/**
	 * Could not complete. `retriable` = transient (5xx/network) → the
	 * reservation stands, retry within the window (krav §6). Non-retriable
	 * = a business rule (already own a ticket, not allowed) that will never
	 * succeed → the machine releases the doomed reservation.
	 */
	| { kind: 'failed'; message?: string; retriable: boolean };

export interface PaymentGateway {
	readonly provider: PurchaseProvider;
	/** Collect payment for the currently held reservation of this kind. */
	pay(ticketKindId: string): Promise<PaymentOutcome>;
}

/** 0 kr tickets — the backend settles them inline (no real payment). */
export const freeGateway: PaymentGateway = {
	provider: 'free',
	async pay(ticketKindId) {
		try {
			const result = await buyReservation({ ticketKindId, provider: 'free' });
			if (result.badRequest)
				return { kind: 'failed', message: result.badRequest.message, retriable: false };
			return { kind: 'completed', ticketId: result.ok.ticketId };
		} catch (err) {
			console.error('free settlement failed', err);
			return { kind: 'failed', retriable: true };
		}
	}
};

/**
 * Swish. Initiates a payment request and, on native, hands off to the
 * Swish app via its deep link; the purchase completes when the
 * transactions service posts the paid-callback to minilith. On web
 * there's no app to open — the request is live and the user pays on
 * their phone; the machine polls either way.
 */
export const swishGateway: PaymentGateway = {
	provider: 'swish',
	async pay(ticketKindId) {
		let result;
		try {
			result = await buyReservation({ ticketKindId, provider: 'swish' });
		} catch (err) {
			console.error('swish initiation failed', err);
			return { kind: 'failed', retriable: true };
		}
		if (result.badRequest)
			return { kind: 'failed', message: result.badRequest.message, retriable: false };

		const token = result.ok.paymentRequestToken;
		if (token && Capacitor.isNativePlatform()) {
			// Open the Swish app via its scheme (not in-app navigation, so
			// the stack helpers don't apply). It returns via the universal
			// link; the machine's poll picks up the server callback.
			// eslint-disable-next-line no-restricted-syntax -- external app deep link
			window.location.href = `swish://paymentrequest?token=${encodeURIComponent(token)}`;
		}
		return { kind: 'submitted' };
	}
};

/** Gateway for a kind, chosen by price (free vs Swish). Stripe/others
 *  slot in here later without touching callers. */
export function gatewayFor(priceOre: number): PaymentGateway {
	return priceOre === 0 ? freeGateway : swishGateway;
}
