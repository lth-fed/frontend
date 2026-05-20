import type { PageLoad } from './$types';
import { listActivities } from '$lib/api/activities';

export const load: PageLoad = async ({ fetch }) => {
	const activities = await listActivities({ fetch });
	return { activities };
};
