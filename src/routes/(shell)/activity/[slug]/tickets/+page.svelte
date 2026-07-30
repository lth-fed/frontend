<script lang="ts">
	import TicketKindCard from '$lib/components/TicketKindCard.svelte';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import type { TicketKind } from '$lib/api';
	import { serverNow } from '$lib/api/serverClock';
	import { deriveKindState } from '$lib/purchase/kindState';
	import {
		acknowledge,
		cancel,
		joinQueue,
		pay,
		purchase,
		resync,
		setAttached
	} from '$lib/purchase/purchase.svelte';
	import { gatewayFor } from '$lib/payment/gateway';
	import { formatPrice } from '$lib/format/money';
	import { replaceNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

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
		if (flow.state === 'purchased') {
			acknowledge();
			void replaceNavigation(Routes.Home, { resetDepth: true });
		}
	});

	// All purchases go through the queue/reservation machine (spec §4.2) —
	// the backend routes free tickets through reservations too; the machine
	// auto-completes those with `provider: 'free'`.
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
					price: kind.price
				},
				kind.purchasingAvailableStart
			);
			if (error) errors.set(kind.id, error);
		} finally {
			busyKindId = null;
		}
	}

	function mmss(until: Date): string {
		const total = Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000));
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	// Payment confirmation (krav §6 "test view"): the reserved kind's Pay
	// button opens this; confirming hands off to the price-appropriate
	// gateway (spec §4.4). Errors surface inline and keep the reservation.
	let confirmingPay = $state(false);
	let payError = $state<string | undefined>(undefined);

	async function confirmPay() {
		confirmingPay = false;
		payError = undefined;
		if (flow.state !== 'reserved') return;
		const { error } = await pay(gatewayFor(flow.kind.price));
		if (error) payError = error;
	}

	useAppBars(() => ({
		topBar: detailTopBar({ title: activity.title }),
		bottom: emptyBottom
	}));
</script>

<div data-guild={activity.creatorGuild} class="flex w-full flex-col gap-3.75 px-4">
	<h2 class="text-[24px] font-semibold">{m.activity_tickets_title()}</h2>

	{#if flow.state !== 'idle' && 'kind' in flow && flow.kind.activityId === activity.id}
		<!-- Active flow panel for a kind on THIS activity (spec §4.5) -->
		<div
			class="flex w-full flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
			role="status">
			<span class="text-[16px] font-semibold text-guild-on-surface">{flow.kind.name}</span>

			{#if flow.state === 'release-queued'}
				<p class="text-sm text-guild-on-surface/80">
					{m.queue_release_countdown({ time: mmss(flow.releaseAt) })}
				</p>
				<p class="text-xs text-guild-on-surface/60">{m.queue_lottery_note()}</p>
			{:else if flow.state === 'resolving'}
				<p class="text-sm text-guild-on-surface/80">{m.queue_resolving()}</p>
			{:else if flow.state === 'reservation-queued'}
				<p class="text-sm text-guild-on-surface/80">
					{m.queue_placement({ placement: flow.placement })}
				</p>
			{:else if flow.state === 'reserved'}
				<p class="text-lg font-semibold text-guild-on-surface">
					{m.queue_pay_within({ time: mmss(flow.latestTransaction) })}
				</p>
				{#if serverNow() < flow.latestTransaction}
					<button
						type="button"
						onclick={() => {
							payError = undefined;
							confirmingPay = true;
						}}
						class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary">
						{m.queue_pay_cta()}
					</button>
				{:else}
					<!-- inside the last minute: too late to safely start (spec §4.2) -->
					<p class="text-sm text-red-700">{m.queue_pay_too_late()}</p>
				{/if}
				{#if payError}
					<p class="text-sm text-red-700" role="alert">{payError}</p>
				{/if}
			{:else if flow.state === 'paying'}
				<p class="text-sm text-guild-on-surface/80">{m.pill_paying()}</p>
			{:else if flow.state === 'delayed'}
				<p class="text-sm text-guild-on-surface/80">{m.queue_delayed()}</p>
				<button
					type="button"
					onclick={() => resync()}
					class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
					{m.error_try_again()}
				</button>
			{:else if flow.state === 'expired'}
				<p class="text-sm text-red-700">{m.queue_expired()}</p>
			{:else if flow.state === 'failed'}
				<p class="text-sm text-red-700">{flow.message ?? m.queue_failed()}</p>
			{/if}

			{#if flow.state === 'expired' || flow.state === 'failed'}
				<button
					type="button"
					onclick={acknowledge}
					class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
					{m.queue_dismiss()}
				</button>
			{:else if flow.state !== 'paying'}
				<button
					type="button"
					onclick={cancel}
					class="w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">
					{m.queue_cancel()}
				</button>
			{/if}
		</div>
	{/if}

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
				onclick={() => handleBuy(ticketKind)} />
		{/each}
	</div>
</div>

{#if confirmingPay && flow.state === 'reserved'}
	<!-- Payment confirmation (krav §6). Backdrop button / Cancel dismisses. -->
	<div class="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
		<button
			type="button"
			aria-label={m.queue_cancel()}
			class="absolute inset-0 h-full w-full bg-black/40"
			onclick={() => (confirmingPay = false)}></button>
		<div
			data-guild={activity.creatorGuild}
			class="relative w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl">
			<h3 class="text-lg font-semibold text-guild-on-surface">{m.pay_confirm_title()}</h3>
			<p class="mt-2 text-sm text-guild-on-surface/80">
				{m.pay_confirm_body({ name: flow.kind.name, price: formatPrice(flow.kind.price) })}
			</p>
			<div class="mt-5 flex flex-col gap-2">
				<button
					type="button"
					onclick={confirmPay}
					class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary">
					{m.pay_confirm_cta({ price: formatPrice(flow.kind.price) })}
				</button>
				<button
					type="button"
					onclick={() => (confirmingPay = false)}
					class="w-full rounded-full px-5 py-3 text-sm font-semibold text-guild-on-surface/70">
					{m.queue_cancel()}
				</button>
			</div>
		</div>
	</div>
{/if}
