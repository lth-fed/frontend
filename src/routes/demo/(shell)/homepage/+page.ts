import type { PageLoad } from './$types';
import { listActivities } from '$lib/api/activities';
import { listMyTickets } from '$lib/api/tickets';
import { getMe } from '$lib/api/user';

export const load: PageLoad = async ({ fetch }) => {
	const [activities, tickets, me] = await Promise.all([
		listActivities({ fetch }),
		listMyTickets({ fetch }),
		getMe({ fetch })
	]);
	return { activities, tickets, me };
};
