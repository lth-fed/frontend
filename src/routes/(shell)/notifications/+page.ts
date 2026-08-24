import type { PageLoad } from './$types';
import { cachedNotificationHistory } from '$lib/api/notifications';

export const load: PageLoad = async ({ depends }) => ({
	notifications: await cachedNotificationHistory(depends)
});
