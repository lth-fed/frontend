import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { getEvent } from '$lib/data/events';

export const load: PageLoad = ({ params }) => {
	const event = getEvent(params.slug);
	if (!event) throw error(404, `Event "${params.slug}" not found`);

	// Warm the browser's image cache so the hero is in flight before the
	// page component renders the <img>. Pairs with data-sveltekit-preload-data
	// on the EventCard link to start fetching on hover.
	if (browser) new Image().src = event.image;

	return { event };
};
