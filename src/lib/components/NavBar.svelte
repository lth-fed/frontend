<script lang="ts" generics="K extends string">
	import type { Component } from 'svelte';

	interface Item {
		id: K;
		icon: Component;
		label: string;
	}

	interface Props {
		items: Item[];
		selected: K;
		onSelect: (id: K) => void;
	}

	let { items, selected, onSelect }: Props = $props();

	let nav = $state<HTMLElement>();
	let buttonEls = $state<HTMLElement[]>([]);
	let highlightStyle = $state('');
	let animated = $state(false);

	$effect(() => {
		if (!nav) return;
		const idx = items.findIndex((it) => it.id === selected);
		const el = buttonEls[idx];
		if (!el) return;
		highlightStyle = `transform: translate(${el.offsetLeft}px, ${el.offsetTop}px); width: ${el.offsetWidth}px; height: ${el.offsetHeight}px;`;
		if (!animated) requestAnimationFrame(() => (animated = true));
	});
</script>

<nav
	bind:this={nav}
	class="relative inline-flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-lg ring-[length:var(--guild-ring-width)] ring-guild-ring"
>
	<div
		aria-hidden="true"
		class="pointer-events-none absolute top-0 left-0 rounded-full bg-guild-primary ring-[length:var(--guild-ring-width)] ring-guild-ring {animated
			? 'transition-[transform,width,height] duration-300 ease-out'
			: ''}"
		style={highlightStyle}
	></div>
	{#each items as it, i (it.id)}
		{@const Icon = it.icon}
		{@const active = selected === it.id}
		<button
			bind:this={buttonEls[i]}
			type="button"
			aria-label={it.label}
			aria-current={active ? 'page' : undefined}
			onclick={() => onSelect(it.id)}
			class="relative z-10 flex size-12 items-center justify-center rounded-full transition-colors duration-300 {active
				? 'text-guild-on-primary'
				: 'text-gray-600'}"
		>
			<Icon class="size-6" />
		</button>
	{/each}
</nav>
