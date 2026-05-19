<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		icon: Component;
		label: string;
		sublabel?: string;
	}

	let { icon: Icon, label, sublabel }: Props = $props();
</script>

<div class="flex items-center gap-2.5">
	<Icon class="size-6 text-guild-accent" aria-hidden="true" />
	{#if sublabel}
		<div class="flex flex-col gap-0.5">
			<span class="text-sm leading-tight font-semibold">{label}</span>
			<span class="text-xs font-normal text-gray-600">{sublabel}</span>
		</div>
	{:else}
		<span class="text-sm leading-tight font-semibold">{label}</span>
	{/if}
</div>
