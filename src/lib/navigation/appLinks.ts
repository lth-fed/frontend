import Routes from './routes';
import type { Pathname } from '$app/types';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ACTIVITY_PATH = new RegExp(`^/activity/(${UUID})/?$`, 'i');
const GROUP_PATH = new RegExp(`^/group/(${UUID})/?$`, 'i');
const APP_ORIGIN = 'https://app.teknologappen.se';
const PENDING_LINK = 'tappen-pending-activity';

export function activityShareUrl(id: string): string {
	return `${APP_ORIGIN}/activity/${encodeURIComponent(id)}/`;
}

/** The in-app page for a shared activity or group link, or `null` for any other URL. */
export function appLinkTarget(value: string): Pathname | null {
	try {
		const url = new URL(value);
		if (url.origin !== APP_ORIGIN) return null;
		const activity = ACTIVITY_PATH.exec(url.pathname);
		if (activity) return Routes.Activity(activity[1]);
		const group = GROUP_PATH.exec(url.pathname);
		return group ? Routes.Group(group[1]) : null;
	} catch {
		return null;
	}
}

export function rememberAppLink(url: string): Pathname | null {
	const target = appLinkTarget(url);
	if (target) {
		try {
			sessionStorage.setItem(PENDING_LINK, target);
		} catch {
			/* Storage can be unavailable. */
		}
	}
	return target;
}

export function takeAppLink(): Pathname | null {
	try {
		const path = sessionStorage.getItem(PENDING_LINK);
		sessionStorage.removeItem(PENDING_LINK);
		return path ? appLinkTarget(`${APP_ORIGIN}${path}`) : null;
	} catch {
		return null;
	}
}
