import Routes from './routes';
import type { Pathname } from '$app/types';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ACTIVITY_PATH = new RegExp(`^/activity/(${UUID})/?$`, 'i');
const APP_ORIGIN = 'https://app.teknologappen.se';
const PENDING_ACTIVITY = 'tappen-pending-activity';

export function activityShareUrl(id: string): string {
	return `${APP_ORIGIN}/activity/${encodeURIComponent(id)}/`;
}

export function activityLinkTarget(value: string): Pathname | null {
	try {
		const url = new URL(value);
		if (url.origin !== APP_ORIGIN) return null;
		const match = ACTIVITY_PATH.exec(url.pathname);
		return match ? Routes.Activity(match[1]) : null;
	} catch {
		return null;
	}
}

export function rememberActivityLink(url: string): Pathname | null {
	const target = activityLinkTarget(url);
	if (target) {
		try {
			sessionStorage.setItem(PENDING_ACTIVITY, target);
		} catch {
			/* Storage can be unavailable. */
		}
	}
	return target;
}

export function takeActivityLink(): Pathname | null {
	try {
		const path = sessionStorage.getItem(PENDING_ACTIVITY);
		sessionStorage.removeItem(PENDING_ACTIVITY);
		return path ? activityLinkTarget(`${APP_ORIGIN}${path}`) : null;
	} catch {
		return null;
	}
}
