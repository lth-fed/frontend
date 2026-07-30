import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { cachedActivity } from '$lib/api/activities';

export const load: PageLoad = async ({ params, depends }) => {
	const activity = await cachedActivity(params.slug, depends);

	// Warm the browser's image cache so the hero is in flight before the
	// page component renders the <img>. Pairs with data-sveltekit-preload-data
	// on the ActivityCard link to start fetching on hover.
	if (browser) new Image().src = activity.image;

	return { activity };
};
