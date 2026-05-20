<script lang="ts">
	import TicketKindCard from '$lib/components/TicketKindCard.svelte';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const event = $derived(data.event);

	useAppBars(() => ({
		topBar: detailTopBar({ title: event.title }),
		bottom: emptyBottom
	}));
</script>

<div class="flex w-full flex-col gap-3.75 px-4">
	<h2 class="text-[24px] font-semibold">{m.event_tickets_title()}</h2>
	<div class="flex w-full flex-col gap-2">
		{#each event.ticketKinds as ticket (ticket.id)}
			<TicketKindCard
				name={ticket.name}
				price={ticket.price}
				onclick={() => alert(`Buy ${ticket.name}`)}
			/>
		{/each}
	</div>
</div>
