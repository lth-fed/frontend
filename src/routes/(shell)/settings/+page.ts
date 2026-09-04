import type { PageLoad } from './$types';
import { cachedPurchasedTickets } from '$lib/api/tickets';
import { browser } from '$app/environment';
import { isConnectivityError } from '$lib/api/errors';

export const load: PageLoad = async ({ depends }) => {
	if (browser && !navigator.onLine) return { tickets: [], networkUnavailable: true };
	try {
		const tickets = await cachedPurchasedTickets(depends);
		return {
			tickets: [...tickets].sort((a, b) => b.timeStart.getTime() - a.timeStart.getTime()),
			networkUnavailable: false
		};
	} catch (error) {
		if (!isConnectivityError(error)) throw error;
		return { tickets: [], networkUnavailable: true };
	}
};
