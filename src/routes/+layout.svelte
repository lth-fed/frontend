<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { session } from '$lib/state/session.svelte';
	import { bootstrapAuth } from '$lib/auth/bootstrap';
	import { readNavigationIntent } from '$lib/navigation/stackNavigation';
	import Landing from '$lib/components/Landing.svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';

	let { children } = $props();

	let bootstrapped = false;
	afterNavigate(() => {
		if (bootstrapped) return;
		bootstrapped = true;
		bootstrapAuth();
	});

	$effect(() => {
		const g = session.guild;
		const els = [document.documentElement, document.body];
		if (g) els.forEach((el) => (el.dataset.guild = g));
		else els.forEach((el) => delete el.dataset.guild);
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (!navigation.from || !navigation.to) return;

		const direction = navigation.type === 'popstate' ? 'back' : readNavigationIntent();
		const { documentElement } = document;

		return new Promise((resolve) => {
			documentElement.dataset.transitionDirection = direction;
			document
				.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				})
				.finished.finally(() => {
					delete documentElement.dataset.transitionDirection;
				});
		});
	});

	beforeNavigate((navigation) => {
		if (navigation.type !== 'popstate' || !navigation.from) return;

		if ((page.state.navDepth ?? 0) === 0) {
			navigation.cancel();
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if !session.accessToken}
	{#if session.isProcessing}
		<div class="grid min-h-screen place-items-center text-sm text-gray-500">
			{m.auth_signing_in()}
		</div>
	{:else}
		<Landing />
	{/if}
{:else}
	<div
		class="min-h-screen max-w-screen min-w-screen bg-gray-100
			pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]
			pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
	>
		{@render children()}
	</div>
{/if}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
