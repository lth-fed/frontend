<script lang="ts">
	import ActivityHeadCard from '$lib/components/ActivityHeadCard.svelte';
	import OrganiserCard from '$lib/components/OrganiserCard.svelte';
	import { buyTicketsBottom, detailTopBar, useAppBars } from '$lib/state/appBars.svelte';
	import { guilds } from '$lib/data/guilds';
	import { formatDetailDate, formatTimeRange } from '$lib/format/datetime';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';
	import { onMount } from 'svelte';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { fly } from 'svelte/transition';
	import { quadOut } from 'svelte/easing';

	let { data }: PageProps = $props();
	const activity = $derived(data.activity);

	let isIos26Native = $state(false);

	onMount(async () => (isIos26Native = await isIos26Plus()));

	useAppBars(() => ({
		topBar: detailTopBar({
			title: activity.title,
			onShare: () => alert(`Share ${activity.title}`)
		}),
		bottom: buyTicketsBottom({
			id: `buy-${activity.id}`,
			onclick: () => pushNavigation(Routes.ActivityTickets(activity.id))
		})
	}));
</script>

<div
	data-guild={activity.creatorGuild}
	class={isIos26Native ? '-mt-[calc(env(safe-area-inset-top)+4.25rem)]' : '-mt-6'}
>
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
				location={activity.location}
			/>
		</div>

		<div
			class="flex w-full flex-col gap-3.75"
			in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}
		>
			<h2 class="text-[24px] font-semibold">{m.activity_about()}</h2>
			<p class="text-[16px] font-normal">{activity.description}</p>
		</div>

		<div
			class="flex w-full flex-col gap-3.75"
			in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}
		>
			<h2 class="text-[24px] font-semibold">{m.activity_organiser()}</h2>
			<div class="flex w-full flex-col gap-2">
				{#each activity.organisers as g (g)}
					<OrganiserCard guild={g} onFollow={() => alert(`Follow ${guilds[g].name}`)} />
				{/each}
			</div>
		</div>

		<div
			class="flex w-full flex-col gap-3.75"
			in:fly={{ y: 28, duration: 140, delay: 120, easing: quadOut }}
		>
			<div class="flex items-center justify-between">
				<h2 class="text-[24px] font-semibold">{m.activity_location()}</h2>
				<span class="text-sm font-semibold text-guild-on-surface">{m.activity_open_maps()}</span>
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
