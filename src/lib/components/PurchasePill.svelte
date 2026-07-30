<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { purchase } from '$lib/purchase/purchase.svelte';
	import { serverNow } from '$lib/api/serverClock';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	// 1 s local tick for the countdowns — pure wall-clock math, no network.
	let now = $state(serverNow());
	onMount(() => {
		const tick = setInterval(() => (now = serverNow()), 1_000);
		return () => clearInterval(tick);
	});

	const flow = $derived(purchase.flow);
	const target = $derived(
		'kind' in flow && flow.kind.activityId
			? Routes.ActivityTickets(flow.kind.activityId)
			: Routes.Home
	);
	const onTargetPage = $derived(page.url.pathname === resolve(target));
	const visible = $derived(
		!onTargetPage &&
			(flow.state === 'release-queued' ||
				flow.state === 'resolving' ||
				flow.state === 'reservation-queued' ||
				flow.state === 'reserved' ||
				flow.state === 'paying' ||
				flow.state === 'delayed')
	);

	function mmss(until: Date): string {
		const total = Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000));
		const minutes = Math.floor(total / 60);
		const seconds = total % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	const label = $derived.by(() => {
		switch (flow.state) {
			case 'release-queued':
				return m.pill_releases_in({ time: mmss(flow.releaseAt) });
			case 'resolving':
				return m.pill_resolving();
			case 'reservation-queued':
				return m.pill_in_queue({ placement: flow.placement });
			case 'reserved':
				return m.pill_pay_within({ time: mmss(flow.latestTransaction) });
			case 'paying':
				return m.pill_paying();
			case 'delayed':
				return m.pill_delayed();
			default:
				return '';
		}
	});

	function open() {
		// The pill hides on its own target page, but guard anyway so a
		// stray tap can never stack a duplicate history entry.
		if (onTargetPage) return;
		pushNavigation(target);
	}
</script>

{#if visible}
	<button
		type="button"
		onclick={open}
		class="fixed right-4 left-4 z-40 rounded-full bg-guild-primary px-5 py-3 text-center text-sm
			font-semibold text-guild-on-primary shadow-lg"
		style="bottom: calc(max(env(safe-area-inset-bottom), 1.5rem) + 5rem)">
		{label}
	</button>
{/if}
