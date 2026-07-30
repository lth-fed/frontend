import type { PageLoad } from './$types';
import { cachedActivities } from '$lib/api/activities';
import { cachedMyTickets } from '$lib/api/tickets';
import { cachedMe } from '$lib/api/user';

export const load: PageLoad = async ({ depends }) => {
	const [activities, tickets, me] = await Promise.all([
		cachedActivities(depends),
		cachedMyTickets(depends),
		cachedMe(depends)
	]);
	return { activities, tickets, me };
};
