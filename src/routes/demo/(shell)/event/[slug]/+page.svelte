<script lang="ts">
	import EventHeadCard from '$lib/components/EventHeadCard.svelte';
	import OrganiserCard from '$lib/components/OrganiserCard.svelte';
	import { buyTicketsBottom, detailTopBar, useAppBars } from '$lib/state/appBars.svelte';
	import { guilds } from '$lib/data/guilds';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	const event = $derived(data.event);

	let isIos26Native = $state(false);

	onMount(async () => (isIos26Native = await isIos26Plus()));

	useAppBars(() => ({
		topBar: detailTopBar({
			title: event.title,
			onShare: () => alert(`Share ${event.title}`)
		}),
		bottom: buyTicketsBottom({
			id: `buy-${event.id}`,
			onclick: () => goto(`/demo/event/${event.id}/tickets`)
		})
	}));
</script>

<div class={isIos26Native ? '-mt-[calc(env(safe-area-inset-top)+4.25rem)]' : '-mt-6'}>
	<img class="z-0 block aspect-video w-full object-cover" src={event.image} alt={event.title} />

	<div class="z-10 -mt-24 flex w-full flex-col gap-8.75 px-4">
		<EventHeadCard
			badge={event.badge}
			title={event.title}
			date={event.detailDate}
			time={event.timeRange}
			location={event.location}
		/>

		<div class="flex w-full flex-col gap-3.75">
			<h2 class="text-[24px] font-semibold">{m.event_about()}</h2>
			<p class="text-[16px] font-normal">{event.description}</p>
		</div>

		<div class="flex w-full flex-col gap-3.75">
			<h2 class="text-[24px] font-semibold">{m.event_organiser()}</h2>
			<div class="flex w-full flex-col gap-2">
				{#each event.organisers as g (g)}
					<OrganiserCard guild={g} onFollow={() => alert(`Follow ${guilds[g].name}`)} />
				{/each}
			</div>
		</div>

		<div class="flex w-full flex-col gap-3.75">
			<div class="flex items-center justify-between">
				<h2 class="text-[24px] font-semibold">{m.event_location()}</h2>
				<span class="text-sm font-semibold text-guild-on-surface">{m.event_open_maps()}</span>
			</div>
			<div class="w-full rounded-3xl border border-gray-100">
				<img
					class="aspect-video w-full rounded-3xl object-cover"
					src="https://picsum.photos/600/400"
					alt="Location"
				/>
			</div>
		</div>
	</div>
</div>
