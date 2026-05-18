<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Ticket as TicketIcon } from '@lucide/svelte';

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

	const events = [
		{
			image: 'https://picsum.photos/seed/home-a/640/360',
			badge: 'SITTNING',
			date: 'Mon, Apr 27 - 17:00',
			title: 'Annan sittning typ',
			priceFrom: 120,
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex.',
			location: 'Gasque-salen'
		},
		{
			image: 'https://picsum.photos/seed/home-b/640/360',
			badge: 'SITTNING',
			date: 'Fri, May 01 - 21:00',
			title: 'Vårfest',
			priceFrom: 80,
			description:
				'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.',
			location: 'Kårhuset'
		},
		{
			image: 'https://picsum.photos/seed/home-c/640/360',
			badge: 'PUB',
			date: 'Tue, May 05 - 18:00',
			title: 'Tisdagspub',
			priceFrom: 40,
			description:
				'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
			location: 'Pub-lokalen'
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

	<div class="mt-4" style="--carousel-item-width: calc(300px * var(--ticket-scale, 1));">
		<Carousel items={tickets}>
			{#snippet item(t)}
				<Ticket {...t} onAction={(id) => alert(`Action: ${id}`)} />
			{/snippet}
			{#snippet empty()}
				<EmptyState
					icon={TicketIcon}
					title={m.home_no_tickets_title()}
					cta={{ label: m.home_browse_events_cta(), onclick: () => alert('Browse') }}
				/>
			{/snippet}
		</Carousel>
	</div>

	<section class="px-6 pt-6 pb-40">
		<h2 class="text-2xl font-bold">{m.home_upcoming_events()}</h2>

		<div class="mt-4 space-y-6">
			{#each events as e (e.title)}
				<EventCard {...e} onclick={() => alert(`Event: ${e.title}`)} />
			{/each}
		</div>
	</section>
</div>
