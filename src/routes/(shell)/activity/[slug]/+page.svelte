<script lang="ts">
	import ActivityHeadCard from '$lib/components/ActivityHeadCard.svelte';
	import OrganiserCard from '$lib/components/OrganiserCard.svelte';
	import {
		buyTicketsBottom,
		detailTopBar,
		emptyBottom,
		useAppBars
	} from '$lib/state/appBars.svelte';
	import { formatDetailDate, formatTimeRange } from '$lib/format/datetime';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';
	import { onMount } from 'svelte';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { fly } from 'svelte/transition';
	import { quadOut } from 'svelte/easing';
	import ActivityMap from '$lib/components/ActivityMap.svelte';
	import MarkdownContent from '$lib/components/MarkdownContent.svelte';

	let { data }: PageProps = $props();
	const activity = $derived(data.activity);

	let isIos26Native = $state(false);

	onMount(async () => (isIos26Native = await isIos26Plus()));

	useAppBars(() => ({
		topBar: detailTopBar({
			title: activity.title
			// onShare: () => alert(`Share ${activity.title}`)
		}),
		// Buy CTA only when the full record confirms sellable tickets
		// (krav §5). While `!full` (list-seeded placeholder), no CTA —
		// the full fetch lands in a moment and re-renders.
		bottom:
			activity.full && activity.ticketsExist
				? buyTicketsBottom({
						id: `buy-${activity.id}`,
						onclick: () => pushNavigation(Routes.ActivityTickets(activity.id))
					})
				: emptyBottom
	}));
</script>

<div
	data-guild={activity.creatorGuild}
	class={isIos26Native ? '-mt-[calc(env(safe-area-inset-top)+4.25rem)]' : '-mt-6'}>
	<div class="z-0 h-75 w-full overflow-hidden">
		<img class="h-full w-full min-w-full object-cover" src={activity.image} alt={activity.title} />
	</div>

	<!-- The animations here are a workaround. There is a backdrop filter applying a bacgkround
	 blur effect on the ActivityHeadCard and this effect won't load until after the page transition
	 in some browsers, which results in an ugly flicker. The animations don't fix this, but they
	 do mask the issue (and I think they look half-decent).

	 If you have a better solution, go wild! -->
	<div class="z-10 -mt-24 flex w-full flex-col gap-8.75 px-4">
		<div in:fly={{ y: -28, duration: 140, delay: 120, easing: quadOut }}>
			<ActivityHeadCard
				title={activity.title}
				date={formatDetailDate(activity.startAt)}
				time={formatTimeRange(activity.startAt, activity.endAt)}
				location={activity.location} />
		</div>

		<div
			class="flex w-full flex-col gap-3.75"
			in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}>
			<h2 class="text-[24px] font-semibold">{m.activity_about()}</h2>
			<MarkdownContent markdown={activity.description} />
		</div>

		{#if activity.contact}
			<div
				class="flex w-full flex-col gap-3.75"
				in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}>
				<h2 class="text-[24px] font-semibold">{m.activity_contact()}</h2>
				<div class="rounded-3xl border border-gray-100 bg-white p-5">
					<p class="font-semibold text-guild-on-surface">{activity.contact.name}</p>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- API-validated mailto/tel contact URI -->
					<a
						href={activity.contact.uri}
						class="mt-1 block text-sm font-semibold break-all text-guild-accent">
						{activity.contact.display}
					</a>
				</div>
			</div>
		{/if}

		<div
			class="flex w-full flex-col gap-3.75"
			in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}>
			<h2 class="text-[24px] font-semibold">{m.activity_organiser()}</h2>
			<div class="flex w-full flex-col gap-2">
				{#if activity.full}
					{#each activity.organisers as organiser (organiser.id)}
						<OrganiserCard {organiser} onFollow={() => alert(`Follow ${organiser.name}`)} />
					{/each}
				{:else}
					<!-- List-seeded placeholder: hosts arrive with the full fetch. -->
					<div class="h-16 w-full animate-pulse rounded-3xl bg-gray-200" aria-hidden="true"></div>
				{/if}
			</div>
		</div>

		{#if activity.locationDetails.name || activity.locationDetails.directions || activity.locationDetails.url || activity.locationDetails.coordinates}
			<div
				class="flex w-full flex-col gap-3.75"
				in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}>
				<div class="flex items-center justify-between">
					<h2 class="text-[24px] font-semibold">{m.activity_location()}</h2>
					{#if activity.locationDetails.url || activity.locationDetails.coordinates}
						<!-- eslint-disable svelte/no-navigation-without-resolve -- external API-provided venue/map URL -->
						<a
							href={activity.locationDetails.url ??
								`https://www.openstreetmap.org/?mlat=${activity.locationDetails.coordinates?.north}&mlon=${activity.locationDetails.coordinates?.east}#map=17/${activity.locationDetails.coordinates?.north}/${activity.locationDetails.coordinates?.east}`}
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm font-semibold text-guild-accent">{m.activity_open_maps()}</a>
					{/if}
				</div>
				{#if activity.locationDetails.directions || activity.locationDetails.name}
					<div class="w-full rounded-3xl border border-gray-100 bg-white p-5">
						{#if activity.locationDetails.name}
							<p class="whitespace-pre-line text-guild-on-surface">
								{activity.locationDetails.name}
							</p>
						{/if}
						{#if activity.locationDetails.directions}
							<p class="mt-2 text-sm whitespace-pre-line text-guild-on-surface/75">
								{activity.locationDetails.directions}
							</p>
						{/if}
					</div>
				{/if}
				{#if activity.locationDetails.coordinates}
					<ActivityMap
						north={activity.locationDetails.coordinates.north}
						east={activity.locationDetails.coordinates.east}
						label={activity.location || activity.title} />
				{/if}
			</div>
		{/if}
	</div>
</div>
