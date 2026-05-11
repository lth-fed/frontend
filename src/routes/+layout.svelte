<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { session } from '$lib/state/session.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	$effect(() => {
		const g = session.guild;
		const els = [document.documentElement, document.body];
		if (g) els.forEach((el) => (el.dataset.guild = g));
		else els.forEach((el) => delete el.dataset.guild);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div
	class="max-h-screen min-h-screen max-w-screen min-w-screen bg-gray-100
			pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]
			pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
>
	{@render children()}
</div>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
