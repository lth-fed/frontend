import * as m from '$lib/paraglide/messages';

/**
 * Prices flow through the api layer in öre (i64 minor units) — the
 * backend's canonical form. Components call this when displaying a
 * price to render the localized SEK string. Zero is the "free" label;
 * everything else is whole kronor (öre divided by 100, rounded for
 * stray fractional input).
 */
export function formatPrice(öre: number): string {
	if (öre <= 0) return m.ticket_price_free();
	return m.activity_price({ amount: Math.round(öre / 100) });
}
