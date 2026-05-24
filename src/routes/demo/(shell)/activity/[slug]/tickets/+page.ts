import type { PageLoad } from './$types';
import { getActivity, getActivityTicketKinds } from '$lib/api/activities';

export const load: PageLoad = async ({ params, fetch }) => {
	const [activity, ticketKinds] = await Promise.all([
		getActivity(params.slug, { fetch }),
		getActivityTicketKinds(params.slug, { fetch })
	]);
	return { activity, ticketKinds };
};
