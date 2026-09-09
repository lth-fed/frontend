const PURCHASE_CELEBRATION_KEY = 'tappen-purchase-celebration';

export function requestPurchaseCelebration(): void {
	try {
		sessionStorage.setItem(PURCHASE_CELEBRATION_KEY, 'true');
	} catch {
		// Storage can be unavailable; the purchase redirect must still succeed.
	}
}

export function consumePurchaseCelebration(): boolean {
	try {
		const requested = sessionStorage.getItem(PURCHASE_CELEBRATION_KEY) === 'true';
		sessionStorage.removeItem(PURCHASE_CELEBRATION_KEY);
		return requested;
	} catch {
		return false;
	}
}
