<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import ActivityCard from '$lib/components/ActivityCard.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Ticket as TicketIcon } from '@lucide/svelte';
	import { formatCardDate } from '$lib/format/datetime';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div
	style="--ticket-scale: clamp(0.8, calc((100dvh - 340px) / 470px), 1); --carousel-item-width: calc(300px * var(--ticket-scale));"
>
	<header class="flex items-baseline justify-between px-6">
		<h2 class="text-[20px] font-semibold">{m.home_my_tickets()}</h2>
		<span class="text-xs font-bold text-guild-accent"
			>{m.home_tickets_count({ count: data.tickets.length })}</span
		>
	</header>

	<div class="z-30 mt-3.5 overflow-y-visible">
		<Carousel items={data.tickets}>
			{#snippet item(t, canFlip, requestCenter)}
				<Ticket
					{...t}
					name={data.me.name}
					{canFlip}
					onRequestCenter={requestCenter}
					onAction={(id) => alert(`Action: ${id}`)}
				/>
			{/snippet}
			{#snippet empty()}
				<EmptyState
					icon={TicketIcon}
					title={m.home_no_tickets_title()}
					cta={{
						label: m.home_browse_activities_cta(),
						onclick: () => {
							document.getElementById('event-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
						}
					}}
				/>
			{/snippet}
		</Carousel>
	</div>

	<section id="event-flow" class="scroll-mt-24 px-6 pt-6">
		<h2 class="text-[20px] font-semibold">{m.home_upcoming_activities()}</h2>

		<div class="mt-3.5 space-y-5.5">
			{#each data.activities as a (a.id)}
				<ActivityCard
					image={a.image}
					date={formatCardDate(a.startAt)}
					title={a.title}
					description={a.description}
					location={a.location}
					creatorGuild={a.creatorGuild}
					href="/demo/activity/{a.id}/"
					transition="forward"
				/>
			{/each}
		</div>
	</section>
</div>
