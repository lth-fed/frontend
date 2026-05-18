<script lang="ts">
	import Ticket from '$lib/components/Ticket.svelte';
	import type { Guild } from '$lib/types/guild';

	const tickets: {
		key: Guild | null;
		label: string;
		subtitle: string;
		location?: string;
		serial: string;
	}[] = [
		{ key: null, label: 'Neutral (default)', subtitle: 'No guild', serial: '#XX-6719284' },
		{
			key: 'f',
			label: 'F-sektionen',
			subtitle: 'F-sektionen',
			location: 'Kan inga F-lokaler',
			serial: '#F-6719284'
		},
		{
			key: 'e',
			label: 'E-sektionen',
			subtitle: 'E-sektionen',
			location: 'Kan inga E-lokaler',
			serial: '#E-6719284'
		},
		{
			key: 'm',
			label: 'M-sektionen',
			subtitle: 'M-sektionen',
			location: 'Kan inga M-lokaler',
			serial: '#M-6719284'
		},
		{
			key: 'v',
			label: 'V-sektionen',
			subtitle: 'V-sektionen',
			location: 'Kan inga V-lokaler',
			serial: '#V-6719284'
		},
		{
			key: 'a',
			label: 'A-sektionen',
			subtitle: 'A-sektionen',
			location: 'Kan inga A-lokaler',
			serial: '#A-6719284'
		},
		{
			key: 'k',
			label: 'K-sektionen',
			subtitle: 'K-sektionen',
			location: 'Kan inga K-lokaler',
			serial: '#K-6719284'
		},
		{
			key: 'd',
			label: 'D-sektionen',
			subtitle: 'D-sektionen',
			location: 'Kan inga D-lokaler',
			serial: '#D-6719284'
		},
		{
			key: 'ing',
			label: 'Ing-sektionen',
			subtitle: 'Ing-sektionen',
			location: 'Kan inga Ing-lokaler',
			serial: '#ING-6719284'
		},
		{
			key: 'w',
			label: 'W-sektionen',
			subtitle: 'W-sektionen',
			location: 'Kan inga W-lokaler',
			serial: '#W-6719284'
		},
		{
			key: 'i',
			label: 'I-sektionen',
			subtitle: 'I-sektionen',
			location: 'Kan inga I-lokaler',
			serial: '#I-6719284'
		}
	];
</script>

<main class="h-screen overflow-y-auto p-8">
	<h1 class="mb-6 text-2xl font-bold">Guild theme preview</h1>

	<div class="flex flex-wrap gap-10 pb-12">
		{#each tickets as { key, label, subtitle, location, serial } (key ?? 'neutral')}
			<div class="space-y-3" data-guild={key ?? undefined}>
				<p class="text-sm font-bold text-gray-600">{label}</p>
				<Ticket
					name="Simon Mechler"
					title="Cool sittning typ"
					{subtitle}
					date="25 Apr, 2026"
					time="17:00 - 23:00"
					{location}
					addition="Wine Package +1"
					{serial}
				/>
			</div>
		{/each}
	</div>
</main>
