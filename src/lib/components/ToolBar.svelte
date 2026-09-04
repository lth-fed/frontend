<script lang="ts" generics="K extends string">
	import type { Component } from 'svelte';

	interface Item {
		id: K;
		icon: Component;
		label: string;
	}

	interface Props {
		items: Item[];
		onAction: (id: K) => void;
	}

	let { items, onAction }: Props = $props();
</script>

<div class="flex items-center justify-center gap-[12px]">
	{#each items as it (it.id)}
		{@const Icon = it.icon}
		<button
			type="button"
			aria-label={it.label}
			onclick={() => onAction(it.id)}
			class="flex size-[48px] items-center justify-center rounded-full bg-white text-gray-700 shadow-md">
			<Icon class="size-[20px]" />
		</button>
	{/each}
</div>
