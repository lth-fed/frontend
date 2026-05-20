import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getEvent } from '$lib/data/events';

export const load: PageLoad = ({ params }) => {
	const event = getEvent(params.slug);
	if (!event) throw error(404, `Event "${params.slug}" not found`);
	return { event };
};
