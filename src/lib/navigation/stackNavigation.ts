import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import type { Pathname } from '$app/types';
import Routes from './routes';

type NavigationIntent = 'forward' | 'back' | 'root';

let pendingIntent: NavigationIntent | null = null;

function currentDepth(): number {
	return page.state.navDepth ?? 0;
}

function nextState(depth: number): App.PageState {
	return {
		...page.state,
		navDepth: depth
	};
}

export function readNavigationIntent(): NavigationIntent {
	return pendingIntent ?? 'root';
}

export async function pushNavigation(url: Pathname, opts?: { noScroll?: boolean }) {
	pendingIntent = 'forward';
	try {
		await goto(resolve(url), {
			replaceState: false,
			noScroll: opts?.noScroll ?? false,
			state: nextState(currentDepth() + 1)
		});
	} finally {
		pendingIntent = null;
	}
}

export async function replaceNavigation(
	url: Pathname,
	opts?: { noScroll?: boolean; resetDepth?: boolean }
) {
	pendingIntent = 'root';
	try {
		await goto(resolve(url), {
			replaceState: true,
			noScroll: opts?.noScroll ?? false,
			state: nextState(opts?.resetDepth ? 0 : currentDepth())
		});
	} finally {
		pendingIntent = null;
	}
}

export function backNavigation() {
	if (currentDepth() <= 0) return false;
	history.back();
	return true;
}

/** Back-chevron default: pop one level, or fall back to Home when
 *  there's no in-app history to pop (fresh load, reset depth). Always
 *  escapes — never a no-op that leaves the user stranded on a page. */
export function goBackOrHome() {
	if (!backNavigation()) void replaceNavigation(Routes.Home, { resetDepth: true });
}
