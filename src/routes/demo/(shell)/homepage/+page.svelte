<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import ActivityCard from '$lib/components/ActivityCard.svelte';
	import Carousel from '$lib/components/Carousel.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Ticket as TicketIcon } from '@lucide/svelte';
	import { formatCardDate } from '$lib/format/datetime';
	import type { PageProps } from './$types';
	import type { Guild } from '$lib/types/guild';

	let { data }: PageProps = $props();

	const tickets: Array<{
		name: string;
		title: string;
		subtitle: string;
		date: string;
		time: string;
		location: string;
		addition: string;
		serial: string;
		creatorGuild: Guild;
	}> = [
		{
			name: 'Simon Mechler',
			title: 'Vårfest',
			subtitle: 'V-sektionen',
			date: '01 May, 2026',
			time: '21:00 - 02:00',
			location: 'Kårhuset',
			addition: 'Early bird',
			serial: '#VG-6719284',
			creatorGuild: 'd'
		},
		{
			name: 'Simon Mechler',
			title: 'Annan sittning typ',
			subtitle: 'A-sektionen',
			date: '27 Apr, 2026',
			time: '17:00 - 23:00',
			location: 'Gasque-salen',
			addition: 'Standard',
			serial: '#AG-6719285',
			creatorGuild: 'a'
		},
		{
			name: 'Simon Mechler',
			title: 'Tisdagspub',
			subtitle: 'I-sektionen',
			date: '05 May, 2026',
			time: '18:00 - 23:00',
			location: 'Pub-lokalen',
			addition: 'Entré',
			serial: '#IG-6719286',
			creatorGuild: 'i'
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
					creatorGuild={a.creatorGuild}
					href="/demo/activity/{a.id}"
					transition="forward"
				/>
			{/each}
		</div>
	</section>
</div>
