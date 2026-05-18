<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import AppNavBar from '$lib/components/AppNavBar.svelte';

	let { children } = $props();
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

	<AppNavBar />
</div>
