<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import BottomActionButton from '$lib/components/BottomActionButton.svelte';
	import { Home, Globe, IdCard, Settings } from '@lucide/svelte';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import { SvelteMap } from 'svelte/reactivity';
	import { m } from '$lib/paraglide/messages.js';
	import { replaceNavigation } from '$lib/navigation/stackNavigation';
	import {
		createAppBars,
		slots,
		type BottomConfig,
		type TopBarConfig
	} from '$lib/state/appBars.svelte';
	import { onMount } from 'svelte';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';

	let { children } = $props();

	let isIos26Native = $state(false);

	onMount(async () => (isIos26Native = await isIos26Plus()));

	type NavId = 'home' | 'links' | 'profile' | 'settings';

	const navItems = $derived([
		{ id: 'home' as NavId, icon: Home, systemIcon: 'house', label: m.nav_home() },
		{ id: 'links' as NavId, icon: Globe, systemIcon: 'globe', label: m.nav_links() },
		{
			id: 'profile' as NavId,
			icon: IdCard,
			systemIcon: 'person.crop.circle',
			label: m.nav_profile()
		},
		{ id: 'settings' as NavId, icon: Settings, systemIcon: 'gear', label: m.nav_settings() }
	]);

	const navRoutes = {
		home: '/demo/homepage',
		links: '/demo/links',
		profile: '/demo/profile',
		settings: '/demo/settings'
	} satisfies Record<NavId, Pathname | null>;

	const selected = $derived<NavId>(
		(Object.entries(navRoutes) as [NavId, Pathname | null][]).find(
			([, route]) => route !== null && page.url.pathname.startsWith(route)
		)?.[0] ?? 'home'
	);

	function handleSelect(id: string) {
		const route = navRoutes[id as NavId];
		if (route) replaceNavigation(route);
		else alert(`${id} (not implemented)`);
	}

	const bars = createAppBars({ topBar: null, bottom: null });

	const defaultTopBar = $derived<TopBarConfig>({
		leading: slots.avatar({ initials: 'SM', onclick: () => alert(m.top_bar_account_label()) }),
		trailing: slots.bell(() => alert(m.top_bar_notifications_label())),
		title: navItems.find((it) => it.id === selected)?.label ?? ''
	});

	const defaultBottom = $derived<BottomConfig>({
		kind: 'tabs',
		items: navItems,
		selected,
		onSelect: handleSelect
	});

	const topBar = $derived(bars.topBar ?? defaultTopBar);
	const bottom = $derived(bars.bottom ?? defaultBottom);

	let mainEl: HTMLElement;
	const scrollPositions = new SvelteMap<string, number>();

	beforeNavigate(({ from }) => {
		if (from && mainEl) {
			scrollPositions.set(from.url.pathname, mainEl.scrollTop);
		}
	});

	afterNavigate(({ to, type }) => {
		if (!mainEl || !to) return;
		const path = to.url.pathname;
		if (type === 'popstate') {
			mainEl.scrollTop = scrollPositions.get(path) ?? 0;
		} else {
			mainEl.scrollTop = 0;
		}
	});
</script>

<div class="shell-topbar fixed inset-x-0 top-0 z-30">
	<TopBar {...topBar} />
</div>

<main
	bind:this={mainEl}
	class="h-full {isIos26Native ? 'mt-17' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)]'} mb-20"
>
	{@render children()}
</main>

{#if bottom.kind === 'tabs'}
	<div
		class="shell-bottom-nav pointer-events-none fixed right-5 bottom-[max(env(safe-area-inset-bottom),1.5rem)] left-5 z-20"
	>
		<div class="pointer-events-auto w-full">
			<NavBar items={bottom.items} selected={bottom.selected} onSelect={bottom.onSelect} />
		</div>
	</div>
{:else if bottom.kind === 'action'}
	<div class="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),1.5rem)] z-20 px-6">
		<BottomActionButton
			id={bottom.id}
			label={bottom.label}
			icon={bottom.icon}
			systemIcon={bottom.systemIcon}
			onclick={bottom.onclick}
			backgroundColor={bottom.backgroundColor}
			foregroundColor={bottom.foregroundColor}
		/>
	</div>
{/if}

<style>
	:global(html[data-navbar-hidden] .shell-bottom-nav) {
		opacity: 0;
		pointer-events: none;
		transform: translateY(-8px);
	}

	.shell-bottom-nav {
		transition:
			opacity 160ms ease,
			transform 160ms ease;
	}
</style>
