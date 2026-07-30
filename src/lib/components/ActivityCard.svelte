<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { MapPin } from '@lucide/svelte';
	import { pushNavigation, replaceNavigation } from '$lib/navigation/stackNavigation';
	import type { Guild } from '$lib/types/guild';

	interface Props {
		image: string;
		badge?: string;
		date: string;
		title: string;
		description: string;
		location?: string;
		href?: Pathname;
		transition?: 'forward' | 'root';
		creatorGuild?: Guild;
		onclick?: () => void;
	}

	let {
		image,
		badge,
		date,
		title,
		description,
		location,
		href,
		transition,
		creatorGuild,
		onclick
	}: Props = $props();

	const cls =
		'block w-full overflow-hidden rounded-3xl bg-white text-left shadow-[0_4px_20px_color-mix(in_srgb,rgb(0_0_0)_12%,transparent)]';
</script>

{#snippet body()}
	<div class="relative">
		<img src={image} alt="" class="block aspect-video w-full object-cover" />
		{#if badge}
			<span
				class="absolute top-3 left-3 rounded-full border border-guild-primary-light bg-guild-surface px-2 py-1.5 text-[10px] leading-none font-bold text-guild-on-surface">
				{badge}
			</span>
		{/if}
	</div>

	<div class="flex flex-col gap-3.5 px-6 pt-3.5 pb-4">
		<div class="flex flex-col gap-1 pt-1.5">
			<p class="text-sm leading-none font-semibold text-guild-accent">{date}</p>
			<h3 class="text-[22px] leading-none font-semibold">{title}</h3>
		</div>

		<p
			class="clear-both line-clamp-4 text-justify text-sm leading-tight hyphens-auto text-gray-600">
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
	<a
		href={resolve(href)}
		data-guild={creatorGuild}
		onclick={(event) => {
			if (onclick) onclick();
			if (!transition) return;
			event.preventDefault();
			if (transition === 'root') replaceNavigation(href, { resetDepth: true });
			else pushNavigation(href);
		}}
		class={cls}
		data-sveltekit-preload-data="hover">
		{@render body()}
	</a>
{:else}
	<button type="button" data-guild={creatorGuild} {onclick} class={cls}>{@render body()}</button>
{/if}
