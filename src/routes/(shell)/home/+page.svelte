<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import ActivityCard from '$lib/components/ActivityCard.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { ListFilter, Ticket as TicketIcon } from '@lucide/svelte';
	import { formatCardDate } from '$lib/format/datetime';
	import Routes from '$lib/navigation/routes';
	import type { PageProps } from './$types';
	import { transferTicket, type Ticket as TicketData } from '$lib/api/tickets';
	import { downloadReceipt } from '$lib/receipt';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import { errorMessage } from '$lib/api/errors';
	import { network } from '$lib/state/network.svelte';
	import { Capacitor } from '@capacitor/core';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();
	const networkUnavailable = $derived(!network.online || data.networkUnavailable);
	let showAndroidAppCard = $state(false);

	onMount(() => {
		showAndroidAppCard =
			!Capacitor.isNativePlatform() && /Android/i.test(window.navigator.userAgent);
	});

	async function ticketAction(
		ticket: TicketData,
		action: 'transfer' | 'wallet' | 'receipt' | 'activity'
	) {
		if (networkUnavailable) {
			alert(m.offline_action_unavailable());
			return;
		}
		try {
			if (action === 'activity') {
				await pushNavigation(Routes.Activity(ticket.activityId));
				return;
			}
			if (action === 'receipt') {
				await downloadReceipt(ticket.id);
				return;
			}
			if (action === 'transfer') {
				const recipient = prompt(m.transfer_recipient_prompt());
				if (recipient?.trim()) await transferTicket(ticket.id, recipient.trim());
			}
		} catch (cause) {
			alert(errorMessage(cause) ?? m.error_status_unknown());
		}
	}
</script>

<div
	style="--ticket-scale: clamp(0.8, calc((100dvh - 340px) / 470px), 1); --carousel-item-width: calc(300px * var(--ticket-scale));">
	{#if showAndroidAppCard}
		<aside class="mx-6 mb-5 rounded-2xl bg-white p-5 text-guild-on-surface shadow-sm">
			<h2 class="text-lg font-semibold">{m.android_app_card_title()}</h2>
			<p class="mt-1.5 text-sm text-guild-on-surface/70">
				{m.android_app_card_description()}
			</p>
			<a
				href="https://play.google.com/store/apps/details?id=se.teknologappen.tappen"
				target="_blank"
				rel="noopener noreferrer"
				class="mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">
				{m.android_app_card_cta()}
			</a>
		</aside>
	{/if}

	<header class="flex items-baseline justify-between px-6">
		<h2 class="text-[20px] font-semibold">{m.home_my_tickets()}</h2>
		<span class="text-xs font-bold text-guild-accent"
			>{m.home_tickets_count({ count: data.tickets.length })}</span>
	</header>

	<div class="z-30 mt-3.5 overflow-y-visible">
		<Carousel items={data.tickets}>
			{#snippet item(t, canFlip, requestCenter)}
				<Ticket
					{...t}
					name={data.ownerName}
					offline={networkUnavailable}
					{canFlip}
					onRequestCenter={requestCenter}
					onAction={(id) => void ticketAction(t, id)} />
			{/snippet}
			{#snippet empty()}
				<EmptyState
					icon={TicketIcon}
					title={m.home_no_tickets_title()}
					cta={{
						label: m.home_browse_activities_cta(),
						onclick: () => {
							document
								.getElementById('event-flow')
								?.scrollIntoView({ behavior: 'smooth', block: 'start' });
						}
					}} />
			{/snippet}
		</Carousel>
	</div>

	<section id="event-flow" class="scroll-mt-24 px-6 pt-6">
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-[20px] font-semibold">{m.home_upcoming_activities()}</h2>
			{#if !networkUnavailable}
				<button
					type="button"
					onclick={() => pushNavigation(Routes.Filters)}
					class="flex items-center gap-2 rounded-full border border-guild-ring bg-white px-3 py-2 text-sm font-semibold text-guild-on-surface">
					<ListFilter class="size-4" aria-hidden="true" />
					{m.filters_title()}
				</button>
			{/if}
		</div>

		{#if networkUnavailable}
			<p class="mt-3.5 rounded-2xl bg-white p-4 text-sm text-guild-on-surface/70">
				{m.offline_activities_unavailable()}
			</p>
		{:else}
			<div class="mt-3.5 space-y-5.5">
				{#each data.activities as a (a.id)}
					<ActivityCard
						image={a.image}
						ticketRelease={a.earliestPurchasableTicketRelease}
						date={formatCardDate(a.startAt)}
						title={a.title}
						description={a.description}
						location={a.location}
						creatorGuild={a.creatorGuild}
						href={Routes.Activity(a.id)}
						transition="forward" />
				{/each}
			</div>
		{/if}
	</section>
</div>
