import { onDestroy, onMount, tick } from 'svelte';
import { isIos26Plus } from '$lib/platform/isIos26Plus';

export type NativeOverlaySpec = {
	/** When false, the native overlay never activates and only the web fallback renders. */
	native: boolean;
	/**
	 * Read whatever reactive sources should re-trigger a configure (e.g. CSS-var
	 * reads via readGuildVar). The return value is discarded — only the reads
	 * inside are tracked.
	 */
	trackDeps: () => unknown;
	/** Apply the current props to the native plugin. */
	configure: () => void;
	/** Hide the native overlay on unmount. */
	hide: () => void;
	/** Optional listener to attach once after the initial configure. */
	attachListener?: () => Promise<{ remove: () => void }>;
};

export type NativeOverlay = {
	/** True once iOS 26 detection resolved positive — gate the web fallback on `!isActive`. */
	readonly isActive: boolean;
	/** True after the initial configure has run — gate subsequent plugin calls on this. */
	readonly configured: boolean;
};

/**
 * Standard lifecycle for an iOS 26 native plugin overlay (tabsBar, nativeButton, …):
 *
 * - on mount, detect iOS 26 → configure → attach listener
 * - whenever `trackDeps` changes, re-configure after `tick()` so DOM updates
 *   (like the root layout's data-guild write) settle before any getComputedStyle
 *   reads inside configure
 * - on unmount, hide and remove the listener
 */
export function useNativeOverlay(spec: NativeOverlaySpec): NativeOverlay {
	let isActive = $state(false);
	let configured = $state(false);
	let listenerRemover: (() => void) | null = null;

	onMount(() => {
		if (!spec.native) return;

		void (async () => {
			isActive = await isIos26Plus();
			if (!isActive) return;

			spec.configure();
			configured = true;

			if (spec.attachListener) {
				const res = await spec.attachListener();
				listenerRemover = res.remove;
			}
		})();
	});

	$effect(() => {
		spec.trackDeps();
		if (!configured) return;
		void tick().then(spec.configure);
	});

	onDestroy(() => {
		if (isActive) spec.hide();
		listenerRemover?.();
	});

	return {
		get isActive() {
			return isActive;
		},
		get configured() {
			return configured;
		}
	};
}
