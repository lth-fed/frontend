import type { PageLoad } from './$types';
import { cachedActivity, cachedTicketKinds } from '$lib/api/activities';

export const load: PageLoad = async ({ params, depends }) => {
	const [activity, ticketKinds] = await Promise.all([
		cachedActivity(params.slug, depends),
		cachedTicketKinds(params.slug, depends)
	]);
	return { activity, ticketKinds };
};
