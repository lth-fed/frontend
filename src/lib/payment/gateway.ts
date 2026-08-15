import { Capacitor } from '@capacitor/core';
import { InAppBrowser } from '@capgo/inappbrowser';
import { buyReservation, type PurchaseProvider } from '$lib/api';
import type { BuyReservationInput } from '$lib/api/tickets';
import { errorMessage } from '$lib/api/errors';
import { m } from '$lib/paraglide/messages.js';

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
	pay(input: Omit<BuyReservationInput, 'provider'>): Promise<PaymentOutcome>;
}

/** 0 kr tickets — the backend settles them inline (no real payment). */
export const freeGateway: PaymentGateway = {
	provider: 'free',
	async pay(input) {
		try {
			const result = await buyReservation({ ...input, provider: 'free' });
			if (result.badRequest)
				return { kind: 'failed', message: result.badRequest.message, retriable: false };
			return { kind: 'completed' };
		} catch (err) {
			console.error('free settlement failed', err);
			return {
				kind: 'failed',
				message: errorMessage(err) ?? m.error_status_unknown(),
				retriable: true
			};
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
	async pay(input) {
		let result;
		try {
			result = await buyReservation({ ...input, provider: 'swish' });
		} catch (err) {
			console.error('swish initiation failed', err);
			return {
				kind: 'failed',
				message: errorMessage(err) ?? m.error_status_unknown(),
				retriable: true
			};
		}
		if (result.badRequest)
			return { kind: 'failed', message: result.badRequest.message, retriable: false };

		const token = result.ok.paymentRequestToken;
		if (token) {
			// Open the Swish app via its scheme (not in-app navigation, so
			// the stack helpers don't apply). It returns via the universal
			// link; the machine's poll picks up the server callback.
			const callbackUrl = Capacitor.isNativePlatform()
				? 'tappen://payment_callback'
				: // eslint-disable-next-line no-restricted-syntax -- callback must be the exact current browser URL
					location.href;
			// eslint-disable-next-line no-restricted-syntax -- external Swish hand-off cannot use in-app navigation
			window.location.href = `swish://paymentrequest?token=${encodeURIComponent(token)}&callbackurl=${encodeURIComponent(callbackUrl)}`;
		}
		return { kind: 'submitted' };
	}
};

export const stripeGateway: PaymentGateway = {
	provider: 'stripe',
	async pay(input) {
		const successUrl = Capacitor.isNativePlatform()
			? 'tappen://payment_callback'
			: `${window.location.origin}/payment-complete/`;
		let result;
		try {
			result = await buyReservation({
				...input,
				provider: 'stripe',
				stripeSuccessUrl: successUrl
			});
		} catch (error) {
			console.error('stripe initiation failed', error);
			return {
				kind: 'failed',
				message: errorMessage(error) ?? m.error_status_unknown(),
				retriable: true
			};
		}
		if (result.badRequest) {
			return { kind: 'failed', message: result.badRequest.message, retriable: false };
		}
		if (!result.ok.stripeUrl)
			return { kind: 'failed', message: m.error_status_unknown(), retriable: true };

		if (Capacitor.isNativePlatform()) {
			void InAppBrowser.openSecureWindow({
				authEndpoint: result.ok.stripeUrl,
				redirectUri: successUrl,
				prefersEphemeralWebBrowserSession: false
			}).catch((error) => console.info('Stripe browser closed', error));
		} else {
			window.open(result.ok.stripeUrl, 'tappen-stripe-payment', 'popup,width=500,height=760');
		}
		return { kind: 'submitted' };
	}
};

/** Resolve an explicitly selected paid provider. */
export function paidGatewayFor(provider: 'swish' | 'stripe'): PaymentGateway {
	return provider === 'stripe' ? stripeGateway : swishGateway;
}
