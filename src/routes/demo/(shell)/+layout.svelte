<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import { Home, Globe, IdCard, Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';

	let { children } = $props();

	type NavId = 'home' | 'links' | 'profile' | 'settings';

	const navItems = $derived([
		{ id: 'home' as NavId, icon: Home, label: m.nav_home() },
		{ id: 'links' as NavId, icon: Globe, label: m.nav_links() },
		{ id: 'profile' as NavId, icon: IdCard, label: m.nav_profile() },
		{ id: 'settings' as NavId, icon: Settings, label: m.nav_settings() }
	]);

	const navRoutes: Record<NavId, string | null> = {
		home: '/demo/homepage',
		links: '/demo/links',
		profile: null,
		settings: null
	};

	const selected = $derived<NavId>(
		page.url.pathname.startsWith('/demo/links') ? 'links' : 'home'
	);

	function handleSelect(id: NavId) {
		const route = navRoutes[id];
		if (route) goto(route);
		else alert(`${id} (not implemented)`);
	}
</script>

<div class="relative h-screen overflow-hidden bg-white">
	<div class="absolute inset-x-0 top-0 z-30">
		<TopBar
			initials="SM"
			onAvatarClick={() => alert('Account')}
			onNotificationsClick={() => alert('Notifications')}
		/>
	</div>

	<main class="h-full overflow-y-auto pt-[72px]">
		{@render children()}
	</main>

	<div class="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
		<div class="pointer-events-auto">
			<NavBar items={navItems} {selected} onSelect={handleSelect} />
		</div>
	</div>
</div>
