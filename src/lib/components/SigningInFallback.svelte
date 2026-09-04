<script lang="ts">
	import { logout } from '$lib/auth/logout';
	import { m } from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';

	let showLogout = $state(false);
	let loggingOut = $state(false);

	onMount(() => {
		const timer = window.setTimeout(() => (showLogout = true), 2_000);
		return () => window.clearTimeout(timer);
	});

	async function handleLogout(): Promise<void> {
		if (loggingOut) return;
		loggingOut = true;
		try {
			await logout();
		} catch (error) {
			console.error('Could not log out from stalled sign-in', error);
			loggingOut = false;
		}
	}
</script>

<div class="grid min-h-screen place-items-center px-6 text-center">
	<div class="flex w-full max-w-sm flex-col items-center gap-4">
		<p class="text-sm text-gray-500">{m.auth_signing_in()}</p>
		{#if showLogout}
			<button
				type="button"
				disabled={loggingOut}
				onclick={() => void handleLogout()}
				class="w-full rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 disabled:opacity-60">
				{m.profile_sign_out()}
			</button>
		{/if}
	</div>
</div>
