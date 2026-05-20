<script lang="ts" generics="K extends string">
	import type { Component } from 'svelte';
	import { tabsBar } from '$lib/plugins/tabsBar/tabsBar';
	import { useNativeOverlay } from '$lib/plugins/useNativeOverlay.svelte';
	import { readGuildVar } from '$lib/state/guildColors.svelte';

	interface Item {
		id: K;
		icon: Component;
		/** SF Symbol name used when the iOS 26 native tab bar takes over. */
		systemIcon?: string;
		label: string;
	}

	interface Props {
		items: Item[];
		selected: K;
		onSelect: (id: K) => void;
		/** When true (default), replace the web pill with the iOS 26 native tab bar. */
		native?: boolean;
		selectedIconColor?: string;
		unselectedIconColor?: string;
	}

	let {
		items,
		selected,
		onSelect,
		native = true,
		selectedIconColor,
		unselectedIconColor
	}: Props = $props();

	let nav = $state<HTMLElement>();
	let buttonEls = $state<HTMLElement[]>([]);
	let highlightStyle = $state('');
	let animated = $state(false);

	function resolveColors() {
		return {
			sel: selectedIconColor ?? readGuildVar('--guild-primary') ?? '#000000',
			un: unselectedIconColor ?? readGuildVar('--guild-surface') ?? '#ffffff'
		};
	}

	function configure() {
		const { sel, un } = resolveColors();
		void tabsBar.configure({
			items: items.map((it) => ({
				id: it.id,
				title: it.label,
				systemIcon: it.systemIcon ?? 'circle'
			})),
			initialId: selected,
			visible: true,
			selectedIconColor: sel,
			unselectedIconColor: un
		});
	}

	const overlay = useNativeOverlay({
		get native() {
			return native;
		},
		trackDeps: resolveColors,
		configure,
		hide: () => void tabsBar.hide?.(),
		attachListener: () =>
			tabsBar.addListener('selected', (event) => {
				if (event.id) onSelect(event.id as K);
			})
	});

	$effect(() => {
		if (!nav || overlay.isActive) return;
		const idx = items.findIndex((it) => it.id === selected);
		const el = buttonEls[idx];
		if (!el) return;
		highlightStyle = `transform: translate(${el.offsetLeft}px, ${el.offsetTop}px); width: ${el.offsetWidth}px; height: ${el.offsetHeight}px;`;
		if (!animated) requestAnimationFrame(() => (animated = true));
	});

	$effect(() => {
		if (!overlay.configured) return;
		void tabsBar.select({ id: selected });
	});
</script>

{#if !overlay.isActive}
	<nav
		bind:this={nav}
		class="relative flex w-full items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_2px_10px_color-mix(in_srgb,var(--guild-primary-light)_75%,transparent)] ring-(length:--guild-ring-width) ring-guild-ring"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none absolute top-0 left-0 rounded-full bg-guild-primary ring-(length:--guild-ring-width) ring-guild-ring {animated
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
				class="relative z-10 flex min-h-12 flex-1 items-center justify-center rounded-full transition-colors duration-300 {active
					? 'text-guild-on-primary'
					: 'text-gray-600'}"
			>
				<Icon class="size-6" />
			</button>
		{/each}
	</nav>
{/if}
