<script lang="ts">
	import { MapPin } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		image: string;
		badge?: string;
		date: string;
		title: string;
		priceFrom?: number;
		description: string;
		location?: string;
		onclick?: () => void;
	}

	let { image, badge, date, title, priceFrom, description, location, onclick }: Props = $props();
</script>

<button
	type="button"
	{onclick}
	class="block w-full overflow-hidden rounded-2xl bg-white text-left shadow-md"
>
	<div class="relative">
		<img src={image} alt="" class="block aspect-[16/9] w-full object-cover" />
		{#if badge}
			<span
				class="absolute top-3 left-3 rounded-full bg-guild-surface px-3 py-1 text-[11px] font-bold tracking-wide text-guild-on-surface"
			>
				{badge}
			</span>
		{/if}
	</div>

	<div class="px-5 py-4">
		{#if priceFrom !== undefined}
			<div class="float-right mt-1 mr-2 ml-4 text-right">
				<p class="text-[11px] leading-none tracking-wide text-gray-500">{m.event_label_from()}</p>
				<p class="mt-0.5 text-lg leading-none font-bold">{m.event_price({ amount: priceFrom })}</p>
			</div>
		{/if}

		<p class="text-sm font-bold text-guild-accent">{date}</p>
		<h3 class="mt-1 text-xl leading-tight font-bold">{title}</h3>

		<p class="clear-both mt-2 line-clamp-4 text-justify text-sm hyphens-auto text-gray-600">
			{description}
		</p>

		{#if location}
			<div class="mt-3 flex items-center gap-1.5 text-sm text-guild-accent">
				<MapPin class="size-4" aria-hidden="true" />
				<span>{location}</span>
			</div>
		{/if}
	</div>
</button>
