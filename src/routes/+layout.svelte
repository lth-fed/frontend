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
	import { App } from '@capacitor/app';
	import { onMount } from 'svelte';
	import { invalidate as invalidateCache } from '$lib/api/cache';
	import {
		onResume as onPurchaseResume,
		restore as restorePurchase
	} from '$lib/purchase/purchase.svelte';
	import { monitorNetwork } from '$lib/state/network.svelte';

	let { children } = $props();

	// Coming back to a backgrounded app: revalidate the fast-moving
	// resources (spec §3.3) and resync any active purchase flow (§4.2).
	// Pages re-render from cache instantly and refresh in the background.
	// On web this fires on tab re-focus.
	onMount(() => {
		const stopMonitoringNetwork = monitorNetwork(() => {
			invalidateCache('me', 'activities', 'tickets', 'purchased-tickets', 'joinable-groups');
		});
		const listener = App.addListener('resume', () => {
			invalidateCache('activities', 'tickets');
			onPurchaseResume();
		});
		return () => {
			stopMonitoringNetwork();
			void listener.then((handle) => handle.remove());
		};
	});

	let bootstrapped = $state(false);
	afterNavigate(async () => {
		if (bootstrapped) return;
		// The callback page owns the in-progress code exchange. Treating its `authenticating`
		// state as an abandoned login here would delete the PKCE state before it can finish.
		if (page.route.id === '/auth/callback') return;
		await bootstrapAuth();
		bootstrapped = true;
		// a queue spot / reservation may have survived the reload
		if (session.accessToken) void restorePurchase();
	});

	$effect(() => {
		const g = session.themeGuild;
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
{#if page.route.id === '/auth/callback'}
	{@render children()}
{:else if !session.accessToken}
	{#if session.isProcessing || !bootstrapped}
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
			pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
		{@render children()}
	</div>
{/if}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
