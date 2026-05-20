<script lang="ts">
	import { onMount } from 'svelte';
	import type { Guild } from '$lib/types/guild';
	import { session } from '$lib/state/session.svelte';

	let { children } = $props();

	const STORAGE_KEY = 'demo:guild';
	const GUILDS: Guild[] = ['f', 'e', 'm', 'v', 'a', 'k', 'd', 'ing', 'w', 'i'];

	let hydrated = false;
	let tearingDown = false;

	onMount(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'null') session.guild = null;
		else if (stored && (GUILDS as string[]).includes(stored)) session.guild = stored as Guild;
		else session.guild = 'f';
		hydrated = true;

		return () => {
			tearingDown = true;
			session.guild = null;
		};
	});

	$effect(() => {
		const g = session.guild;
		if (!hydrated || tearingDown) return;
		localStorage.setItem(STORAGE_KEY, g ?? 'null');
	});
</script>

{@render children()}
