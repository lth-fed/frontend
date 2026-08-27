import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { navigating, page } from '$app/state';
import type { Pathname } from '$app/types';
import Routes from './routes';

type NavigationIntent = 'forward' | 'back' | 'root';

let pendingIntent: NavigationIntent | null = null;
/** The navigation this module most recently started, until its `goto` has returned. */
let inFlight: Promise<void> | null = null;

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

function navigate(intent: NavigationIntent, run: () => Promise<void>): Promise<void> {
	pendingIntent = intent;
	const navigation = run().finally(() => {
		pendingIntent = null;
		if (inFlight === navigation) inFlight = null;
	});
	inFlight = navigation;
	return navigation;
}

export function pushNavigation(url: Pathname, opts?: { noScroll?: boolean }): Promise<void> {
	return navigate('forward', () =>
		goto(resolve(url), {
			replaceState: false,
			noScroll: opts?.noScroll ?? false,
			state: nextState(currentDepth() + 1)
		})
	);
}

export function replaceNavigation(
	url: Pathname,
	opts?: { noScroll?: boolean; resetDepth?: boolean }
): Promise<void> {
	return navigate('root', () =>
		goto(resolve(url), {
			replaceState: true,
			noScroll: opts?.noScroll ?? false,
			state: nextState(opts?.resetDepth ? 0 : currentDepth())
		})
	);
}

/**
 * Resolves once no navigation is pending.
 *
 * SvelteKit lets an `invalidate()` win over a navigation whose loads are still running: the
 * navigation is dropped and its `goto` resolves without moving. Background load re-runs (cache
 * revalidation, the locale switch after sign-in) await this first so they never strand the user
 * on the page being left — at cold start that page is the sign-in fallback.
 */
export async function navigationSettled(): Promise<void> {
	while (inFlight) await inFlight.catch(() => undefined);
	// Navigations SvelteKit started itself (back gesture / popstate). An aborted one stays in
	// `navigating` with a rejected `complete` until the next navigation, so stop as soon as the
	// awaited promise is still the current one.
	let pending = navigating.complete;
	while (pending) {
		await pending.catch(() => undefined);
		const next = navigating.complete;
		if (next === pending) return;
		pending = next;
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
