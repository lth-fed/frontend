<script lang="ts">
	import NavBar from './NavBar.svelte';
	import { Home, Globe, IdCard, Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';

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

<div class="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
	<div class="pointer-events-auto">
		<NavBar items={navItems} {selected} onSelect={handleSelect} />
	</div>
</div>
