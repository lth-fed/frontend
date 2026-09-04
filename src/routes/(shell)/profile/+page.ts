import type { PageLoad } from './$types';
import { cachedMe } from '$lib/api/user';
import { cachedJoinableGroups } from '$lib/api/groups';
import { browser } from '$app/environment';
import { isConnectivityError } from '$lib/api/errors';

export const load: PageLoad = async ({ depends }) => {
	const me = await cachedMe(depends);
	if (browser && !navigator.onLine) {
		return { me, joinableGroups: [], networkUnavailable: true };
	}
	try {
		return { me, joinableGroups: await cachedJoinableGroups(depends), networkUnavailable: false };
	} catch (error) {
		if (!isConnectivityError(error)) throw error;
		return { me, joinableGroups: [], networkUnavailable: true };
	}
};
