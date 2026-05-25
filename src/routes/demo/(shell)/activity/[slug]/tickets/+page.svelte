<script lang="ts">
	import TicketKindCard from '$lib/components/TicketKindCard.svelte';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import { buyFreeTicket } from '$lib/api';
	import { pushNavigation } from '$lib/navigation/stackNavigation';

	let { data }: PageProps = $props();
	const activity = $derived(data.activity);

	async function handleBuyTicket(ticketKindId: string) {
		try {
			await buyFreeTicket({ addonIds: [], ticketKindId });
			await pushNavigation('/demo/homepage/');
		} catch (e) {
			console.log(e);
			alert(`något gick snett! ${e?.body?.message}`);
		}
	}

	useAppBars(() => ({
		topBar: detailTopBar({ title: activity.title }),
		bottom: emptyBottom
	}));
</script>

<div data-guild={activity.creatorGuild} class="flex w-full flex-col gap-3.75 px-4">
	<h2 class="text-[24px] font-semibold">{m.activity_tickets_title()}</h2>
	<div class="flex w-full flex-col gap-2">
		{#each data.ticketKinds as ticketKind (ticketKind.id)}
			<TicketKindCard
				name={ticketKind.name}
				price={ticketKind.price}
				onclick={() => handleBuyTicket(ticketKind.id)} />
		{/each}
	</div>
</div>
