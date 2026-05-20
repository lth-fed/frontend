import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { getActivity } from '$lib/api/activities';

export const load: PageLoad = async ({ params, fetch }) => {
	const activity = await getActivity(params.slug, { fetch });

	// Warm the browser's image cache so the hero is in flight before the
	// page component renders the <img>. Pairs with data-sveltekit-preload-data
	// on the ActivityCard link to start fetching on hover.
	if (browser) new Image().src = activity.image;

	return { activity };
};
