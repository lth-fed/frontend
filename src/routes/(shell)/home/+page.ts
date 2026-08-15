import type { PageLoad } from './$types';
import { cachedActivities } from '$lib/api/activities';
import { cachedMyTickets } from '$lib/api/tickets';
import { cachedMe } from '$lib/api/user';
import { browser } from '$app/environment';
import { isConnectivityError } from '$lib/api/errors';

export const load: PageLoad = async ({ depends }) => {
	const offline = browser && !navigator.onLine;
	const [activitiesResult, ticketsResult, meResult] = await Promise.allSettled([
		offline ? Promise.resolve([]) : cachedActivities(depends),
		cachedMyTickets(depends),
		cachedMe(depends)
	]);
	if (!offline) {
		for (const result of [activitiesResult, ticketsResult, meResult]) {
			if (result.status === 'rejected' && !isConnectivityError(result.reason)) throw result.reason;
		}
	}
	const activities = activitiesResult.status === 'fulfilled' ? activitiesResult.value : [];
	const tickets = ticketsResult.status === 'fulfilled' ? ticketsResult.value : [];
	const cutoff = Date.now() - 6 * 60 * 60 * 1000;
	return {
		activities,
		tickets: tickets.filter((ticket) => ticket.timeEnd.getTime() > cutoff),
		ownerName: meResult.status === 'fulfilled' ? meResult.value.name : '',
		networkUnavailable:
			offline ||
			activitiesResult.status === 'rejected' ||
			ticketsResult.status === 'rejected' ||
			meResult.status === 'rejected'
	};
};
