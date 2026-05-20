import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { getActivity } from '$lib/data/activities';

export const load: PageLoad = ({ params }) => {
	const activity = getActivity(params.slug);
	if (!activity) throw error(404, `Activity "${params.slug}" not found`);

	// Warm the browser's image cache so the hero is in flight before the
	// page component renders the <img>. Pairs with data-sveltekit-preload-data
	// on the ActivityCard link to start fetching on hover.
	if (browser) new Image().src = activity.image;

	return { activity };
};
