<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import BottomActionButton from '$lib/components/BottomActionButton.svelte';
	import { Home, Globe, IdCard, Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import {
		createAppBars,
		slots,
		type BottomConfig,
		type TopBarConfig
	} from '$lib/state/appBars.svelte';

	let { children } = $props();

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

	const navRoutes: Record<NavId, string | null> = {
		home: '/demo/homepage',
		links: '/demo/links',
		profile: null,
		settings: null
	};

	const selected = $derived<NavId>(page.url.pathname.startsWith('/demo/links') ? 'links' : 'home');

	function handleSelect(id: string) {
		const route = navRoutes[id as NavId];
		if (route) goto(route);
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
</script>

<div class="relative h-screen overflow-hidden bg-white">
	<div class="absolute inset-x-0 top-0 z-30">
		<TopBar {...topBar} />
	</div>

	<main class="h-full overflow-y-auto pt-[72px] pb-40">
		{@render children()}
	</main>

	{#if bottom.kind === 'tabs'}
		<div
			class="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),1.5rem)] z-20 flex justify-center"
		>
			<div class="pointer-events-auto">
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
</div>
