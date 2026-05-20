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
		href?: string;
		onclick?: () => void;
	}

	let { image, badge, date, title, priceFrom, description, location, href, onclick }: Props =
		$props();

	const cls =
		'block w-full overflow-hidden rounded-3xl bg-white text-left shadow-[0_4px_20px_color-mix(in_srgb,rgb(0_0_0)_12%,transparent)]';
</script>

{#snippet body()}
	<div class="relative">
		<img src={image} alt="" class="block aspect-video w-full object-cover" />
		{#if badge}
			<span
				class="absolute top-3 left-3 rounded-full border border-guild-primary-light bg-guild-surface px-2 py-1.5 text-[10px] leading-none font-bold text-guild-on-surface"
			>
				{badge}
			</span>
		{/if}
	</div>

	<div class="flex flex-col gap-3.5 px-6 pt-3.5 pb-4">
		<div class="flex items-center justify-between pt-1.5">
			<div class="flex flex-col gap-1">
				<p class="text-sm leading-none font-semibold text-guild-accent">{date}</p>
				<h3 class="text-[22px] leading-none font-semibold">{title}</h3>
			</div>

			{#if priceFrom !== undefined}
				<div class="flex flex-col items-center gap-0.5">
					<p class="text-xs leading-none font-medium tracking-wide text-gray-500">
						{m.activity_label_from()}
					</p>
					<p class="w-fit text-base leading-none font-semibold text-guild-on-surface">
						{m.activity_price({ amount: priceFrom })}
					</p>
				</div>
			{/if}
		</div>

		<p
			class="clear-both line-clamp-4 text-justify text-sm leading-tight hyphens-auto text-gray-600"
		>
			{description}
		</p>

		{#if location}
			<div class="flex items-center gap-1 text-sm font-medium text-guild-on-surface">
				<MapPin class="size-4" aria-hidden="true" />
				<span>{location}</span>
			</div>
		{/if}
	</div>
{/snippet}

{#if href}
	<a {href} {onclick} class={cls} data-sveltekit-preload-data="hover">{@render body()}</a>
{:else}
	<button type="button" {onclick} class={cls}>{@render body()}</button>
{/if}
