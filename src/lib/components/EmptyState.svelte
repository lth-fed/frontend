<script lang="ts">
	import type { Component } from 'svelte';
	import { ArrowRight } from '@lucide/svelte';

	interface Cta {
		label: string;
		onclick?: () => void;
		href?: string;
	}

	interface Props {
		icon: Component;
		title: string;
		cta?: Cta;
	}

	let { icon: Icon, title, cta }: Props = $props();
</script>

<div class="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-10">
	<div class="flex flex-col items-center gap-4 text-center">
		<div
			class="flex size-16 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface"
		>
			<Icon class="size-7" />
		</div>

		<h3 class="text-xl font-bold text-gray-800">{title}</h3>

		{#if cta}
			{#if cta.href}
				<a href={cta.href} class="inline-flex items-center gap-1.5 font-bold text-guild-accent">
					{cta.label}
					<ArrowRight class="size-4" aria-hidden="true" />
				</a>
			{:else}
				<button
					type="button"
					onclick={cta.onclick}
					class="inline-flex items-center gap-1.5 font-bold text-guild-accent"
				>
					{cta.label}
					<ArrowRight class="size-4" aria-hidden="true" />
				</button>
			{/if}
		{/if}
	</div>
</div>
