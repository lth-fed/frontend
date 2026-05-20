import type { PageLoad } from './$types';
import { getActivity } from '$lib/api/activities';

export const load: PageLoad = async ({ params, fetch }) => {
	const activity = await getActivity(params.slug, { fetch });
	return { activity };
};
