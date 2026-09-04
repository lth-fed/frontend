import type { PageLoad } from './$types';
import { cachedActivities } from '$lib/api/activities';
import { cachedMyTickets } from '$lib/api/tickets';
import { cachedMe } from '$lib/api/user';
import { browser } from '$app/environment';
import { isConnectivityError } from '$lib/api/errors';
import {
	cachedFilterGroups,
	cachedGroupSettings,
	defaultGroupSettings,
	groupSettingsAreDefault
} from '$lib/api/groups';

export const load: PageLoad = async ({ depends }) => {
	const offline = browser && !navigator.onLine;
	const [activitiesResult, ticketsResult, meResult, settingsResult, groupsResult] =
		await Promise.allSettled([
			offline ? Promise.resolve([]) : cachedActivities(depends),
			cachedMyTickets(depends),
			cachedMe(depends),
			offline ? Promise.resolve([]) : cachedGroupSettings(depends),
			offline ? Promise.resolve([]) : cachedFilterGroups(depends)
		]);
	if (!offline) {
		for (const result of [
			activitiesResult,
			ticketsResult,
			meResult,
			settingsResult,
			groupsResult
		]) {
			if (result.status === 'rejected' && !isConnectivityError(result.reason)) throw result.reason;
		}
	}
	const activities = activitiesResult.status === 'fulfilled' ? activitiesResult.value : [];
	const tickets = ticketsResult.status === 'fulfilled' ? ticketsResult.value : [];
	const me = meResult.status === 'fulfilled' ? meResult.value : undefined;
	const groupSettings = settingsResult.status === 'fulfilled' ? settingsResult.value : [];
	const groups = groupsResult.status === 'fulfilled' ? groupsResult.value : [];
	const defaultSettings = defaultGroupSettings(groups, me?.groups ?? []);
	const cutoff = Date.now() - 6 * 60 * 60 * 1000;
	return {
		activities,
		tickets: tickets.filter((ticket) => ticket.timeEnd.getTime() > cutoff),
		ownerName: me?.name ?? '',
		groupSettings,
		defaultSettings,
		filtersAreDefault: groupSettingsAreDefault(groupSettings, defaultSettings),
		networkUnavailable:
			offline ||
			activitiesResult.status === 'rejected' ||
			ticketsResult.status === 'rejected' ||
			meResult.status === 'rejected' ||
			settingsResult.status === 'rejected' ||
			groupsResult.status === 'rejected'
	};
};
