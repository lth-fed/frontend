<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Ticket as TicketIcon } from '@lucide/svelte';
	import { eventList } from '$lib/data/events';

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

<div style="--ticket-scale: clamp(0.8, calc((100dvh - 340px) / 470px), 1);">
	<header class="mt-2 flex items-baseline justify-between px-6">
		<h2 class="text-2xl font-bold">{m.home_my_tickets()}</h2>
		<span class="text-sm font-bold text-guild-accent"
			>{m.home_tickets_count({ count: tickets.length })}</span
		>
	</header>

	<div class="mt-4">
		<Carousel items={tickets}>
			{#snippet item(t)}
				<Ticket {...t} onAction={(id) => alert(`Action: ${id}`)} />
			{/snippet}
			{#snippet empty()}
				<EmptyState
					icon={TicketIcon}
					title={m.home_no_tickets_title()}
					cta={{
						label: m.home_browse_events_cta(),
						onclick: () => alert(m.home_browse_events_cta())
					}}
				/>
			{/snippet}
		</Carousel>
	</div>

	<section class="px-6 pt-6">
		<h2 class="text-2xl font-bold">{m.home_upcoming_events()}</h2>

		<div class="mt-4 space-y-6">
			{#each eventList as e (e.id)}
				<EventCard
					image={e.image}
					badge={e.badge}
					date={e.cardDate}
					title={e.title}
					priceFrom={e.priceFrom}
					description={e.description}
					location={e.location}
					href="/demo/event/{e.id}"
				/>
			{/each}
		</div>
	</section>
</div>
