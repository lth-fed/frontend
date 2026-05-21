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

	const tickets = [
		{
			name: 'Simon Mechler',
			title: 'Cool sittning typ',
			subtitle: 'F-sektionen',
			date: '25 Apr, 2026',
			time: '17:00 - 23:00',
			location: 'Kan inga F-lokaler',
			addition: 'Wine Package +1',
			serial: '#FG-6719284'
		},
		{
			name: 'Simon Mechler',
			title: 'Annan sittning typ',
			subtitle: 'F-sektionen',
			date: '27 Apr, 2026',
			time: '17:00 - 23:00',
			location: 'Gasque-salen',
			addition: 'Standard',
			serial: '#FG-6719285'
		},
		{
			name: 'Simon Mechler',
			title: 'Tredje sittning',
			subtitle: 'F-sektionen',
			date: '29 Apr, 2026',
			time: '18:00 - 00:00',
			location: 'Kårhuset',
			addition: 'VIP',
			serial: '#FG-6719286'
		}
	];
</script>

<div
	style="--ticket-scale: clamp(0.8, calc((100dvh - 340px) / 470px), 1); --carousel-item-width: calc(300px * var(--ticket-scale));"
>
	<header class="flex items-baseline justify-between px-6">
		<h2 class="text-[20px] font-semibold">{m.home_my_tickets()}</h2>
		<span class="text-xs font-bold text-guild-accent"
			>{m.home_tickets_count({ count: tickets.length })}</span
		>
	</header>

	<div class="z-30 mt-3.5 overflow-y-visible">
		<Carousel items={tickets}>
			{#snippet item(t, canFlip, requestCenter)}
				<Ticket
					{...t}
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
						onclick: () => alert(m.home_browse_activities_cta())
					}}
				/>
			{/snippet}
		</Carousel>
	</div>

	<section class="px-6 pt-6">
		<h2 class="text-[20px] font-semibold">{m.home_upcoming_activities()}</h2>

		<div class="mt-3.5 space-y-5.5">
			{#each data.activities as a (a.id)}
				<ActivityCard
					image={a.image}
					badge={a.badge}
					date={formatCardDate(a.startAt)}
					title={a.title}
					priceFrom={a.priceFrom}
					description={a.description}
					location={a.location}
					href="/demo/activity/{a.id}"
					transition="forward"
				/>
			{/each}
		</div>
	</section>
</div>
