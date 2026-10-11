<script lang="ts">
	import TicketKindCard from '$lib/components/TicketKindCard.svelte';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import type { TicketKind } from '$lib/api';
	import { serverNow } from '$lib/api/serverClock';
	import { deriveKindState } from '$lib/purchase/kindState';
	import { acknowledge, joinQueue, purchase, setAttached } from '$lib/purchase/purchase.svelte';
	import { requestPurchaseCelebration } from '$lib/purchase/celebration';
	import { pushNavigation, replaceNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { errorMessage } from '$lib/api/errors';

	let { data }: PageProps = $props();
	const activity = $derived(data.activity);
	const flow = $derived(purchase.flow);
	const flowKindId = $derived('kind' in flow ? flow.kind.ticketKindId : undefined);

	// Gating states are time-derived; tick so cards flip live when a
	// release window opens or sales close while the page is visible.
	let now = $state(serverNow());
	onMount(() => {
		const tick = setInterval(() => (now = serverNow()), 1_000);
		setAttached(true);
		return () => {
			clearInterval(tick);
			setAttached(false);
		};
	});

	/** Per-kind inline 400 message from the last attempt (spec §7). */
	const errors = new SvelteMap<string, string>();
	let busyKindId = $state<string | null>(null);

	// Landing a purchase (free or via reservation) sends the user home
	// to the ticket carousel.
	$effect(() => {
		if (flow.state === 'purchased' && flow.kind.activityId === activity.id) {
			requestPurchaseCelebration();
			acknowledge();
			void replaceNavigation(Routes.Home, { resetDepth: true });
		}
	});

	async function handleBuy(kind: TicketKind) {
		if (busyKindId) return;
		errors.delete(kind.id);
		busyKindId = kind.id;
		try {
			const error = await joinQueue(
				{
					ticketKindId: kind.id,
					activityId: activity.id,
					name: kind.name,
					requiresPayment: kind.price !== 0
				},
				kind.purchasingAvailableStart
			);
			if (error) errors.set(kind.id, error);
			else openCheckout();
		} catch (cause) {
			errors.set(kind.id, errorMessage(cause) ?? m.error_status_unknown());
		} finally {
			busyKindId = null;
		}
	}

	let navigationError = $state<string | undefined>();
	let openingCheckout = false;

	function openCheckout(): void {
		if (openingCheckout) return;
		openingCheckout = true;
		navigationError = undefined;
		void pushNavigation(Routes.ActivityAddons(activity.id), {
			returnTo: Routes.ActivityTickets(activity.id)
		})
			.catch((cause) => {
				navigationError = errorMessage(cause) ?? m.error_status_unknown();
			})
			.finally(() => {
				openingCheckout = false;
			});
	}

	useAppBars(() => ({
		topBar: detailTopBar({ title: activity.title }),
		bottom: emptyBottom
	}));
</script>

<div data-guild={activity.creatorGuild} class="flex w-full flex-col gap-3.75 px-4">
	<h2 class="text-[24px] font-semibold">{m.activity_tickets_title()}</h2>

	{#if navigationError}<p class="text-sm text-red-700" role="alert">{navigationError}</p>{/if}

	<div class="flex w-full flex-col gap-2">
		{#each data.ticketKinds as ticketKind (ticketKind.id)}
			<TicketKindCard
				name={ticketKind.name}
				price={ticketKind.price}
				state={deriveKindState(ticketKind, now)}
				error={errors.get(ticketKind.id)}
				busy={busyKindId === ticketKind.id}
				inFlow={flowKindId === ticketKind.id}
				flowActive={flow.state !== 'idle'}
				resumable={flowKindId === ticketKind.id}
				onclick={() => (flowKindId === ticketKind.id ? openCheckout() : handleBuy(ticketKind))} />
		{/each}
	</div>
</div>
