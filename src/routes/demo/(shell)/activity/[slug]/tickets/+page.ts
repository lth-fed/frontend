import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getActivity } from '$lib/data/activities';

export const load: PageLoad = ({ params }) => {
	const activity = getActivity(params.slug);
	if (!activity) throw error(404, `Activity "${params.slug}" not found`);
	return { activity };
};
