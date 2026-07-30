import { getContext, onDestroy, setContext } from 'svelte';
import type { Component } from 'svelte';
import { Bell, ChevronLeft, ShareIcon, TicketIcon } from '@lucide/svelte';
import { m } from '$lib/paraglide/messages.js';
import { goBackOrHome } from '$lib/navigation/stackNavigation';

export type TopBarSlot =
	| {
			kind: 'avatar';
			/** Backend user id (e.g. `test:si1234mc-s`). `Avatar` parses
			 *  initials internally — pass `session.userId` straight through. */
			userId: string | null | undefined;
			systemIcon: string;
			onclick?: () => void;
			label?: string;
	  }
	| {
			kind: 'icon';
			icon: Component;
			systemIcon: string;
			onclick?: () => void;
			label?: string;
			/** Tailwind class applied to the icon. Defaults to a neutral stroke. */
			iconClass?: string;
	  };

export type TopBarConfig = {
	leading?: TopBarSlot | null;
	trailing?: TopBarSlot | null;
	title?: string;
};

export type BottomNavItem<K extends string = string> = {
	id: K;
	icon: Component;
	systemIcon: string;
	label: string;
};

export type BottomConfig =
	| {
			kind: 'tabs';
			items: BottomNavItem[];
			selected: string;
			onSelect: (id: string) => void;
	  }
	| {
			kind: 'action';
			id: string;
			label: string;
			icon: Component;
			systemIcon: string;
			onclick: () => void;
			backgroundColor?: string;
			foregroundColor?: string;
	  }
	| { kind: 'none' };

export const emptyBottom: BottomConfig = { kind: 'none' };

/**
 * The active page's override values, or null to fall back to the layout's
 * defaults. The layout resolves null fields to its own derived defaults.
 */
export type AppBars = {
	topBar: TopBarConfig | null;
	bottom: BottomConfig | null;
};

const KEY = Symbol('appBars');

export function createAppBars(defaults: AppBars): AppBars {
	const state = $state(defaults);
	setContext(KEY, state);
	return state;
}

/**
 * Inside a page rendered under a layout that called createAppBars, override
 * the top bar / bottom area for the lifetime of the page. Pass a reactive
 * getter so live data (activity titles, etc.) flows through. Defaults are
 * restored automatically when the page unmounts.
 */
export function useAppBars(getConfig: () => Partial<AppBars>) {
	const bars = getContext<AppBars>(KEY);
	if (!bars) throw new Error('useAppBars called outside of a layout that called createAppBars');

	$effect(() => {
		const next = getConfig();
		if (next.topBar !== undefined) bars.topBar = next.topBar;
		if (next.bottom !== undefined) bars.bottom = next.bottom;
	});

	onDestroy(() => {
		bars.topBar = null;
		bars.bottom = null;
	});
}

/* ============================================================
   Pre-made TopBar slot library. Each entry returns a TopBarSlot
   with icon + native systemIcon + paraglide label baked in.
   Used like a small palette: slots.back(), slots.share(handler),
   slots.avatar({ initials, onclick }), slots.bell(onclick).
   ============================================================ */
export const slots = {
	avatar(opts: { userId: string | null | undefined; onclick?: () => void }): TopBarSlot {
		return {
			kind: 'avatar',
			userId: opts.userId,
			systemIcon: 'person',
			label: m.top_bar_account_label(),
			onclick: opts.onclick
		};
	},
	bell(onclick?: () => void): TopBarSlot {
		return {
			kind: 'icon',
			icon: Bell,
			systemIcon: 'bell',
			label: m.top_bar_notifications_label(),
			onclick
		};
	},
	back(onclick?: () => void): TopBarSlot {
		return {
			kind: 'icon',
			icon: ChevronLeft,
			systemIcon: 'chevron.left',
			label: m.back_label(),
			// depth-aware default that always escapes (never strands the
			// user), overridable per page
			onclick: onclick ?? goBackOrHome
		};
	},
	share(onclick: () => void): TopBarSlot {
		return {
			kind: 'icon',
			icon: ShareIcon,
			systemIcon: 'square.and.arrow.up',
			label: m.share_label(),
			onclick
		};
	}
};

/** A typical detail-page top bar: back chevron, optional share, centered title. */
export function detailTopBar(opts: {
	title: string;
	onBack?: () => void;
	onShare?: () => void;
}): TopBarConfig {
	return {
		leading: slots.back(opts.onBack),
		trailing: opts.onShare ? slots.share(opts.onShare) : null,
		title: opts.title
	};
}

export function buyTicketsBottom(opts: { id: string; onclick: () => void }): BottomConfig {
	return {
		kind: 'action',
		id: opts.id,
		label: m.activity_buy_tickets(),
		icon: TicketIcon,
		systemIcon: 'ticket',
		onclick: opts.onclick
	};
}
