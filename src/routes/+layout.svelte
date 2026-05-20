<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { session } from '$lib/state/session.svelte';
	import { bootstrapAuth } from '$lib/auth/bootstrap';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	onMount(() => {
		bootstrapAuth();
	});

	$effect(() => {
		const g = session.guild;
		const els = [document.documentElement, document.body];
		if (g) els.forEach((el) => (el.dataset.guild = g));
		else els.forEach((el) => delete el.dataset.guild);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div
	class="min-h-screen max-w-screen min-w-screen bg-gray-100
			pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]
			pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
>
	{#if session.ready}
		{@render children()}
	{:else}
		<div class="grid min-h-screen place-items-center text-sm text-gray-500">
			{m.auth_signing_in()}
		</div>
	{/if}
</div>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
