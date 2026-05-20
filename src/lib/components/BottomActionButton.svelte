<script lang="ts">
	import type { Component } from 'svelte';
	import { nativeButton } from '$lib/plugins/nativeButton/nativeButton';
	import { useNativeOverlay } from '$lib/plugins/useNativeOverlay.svelte';
	import { readGuildVar } from '$lib/state/guildColors.svelte';

	interface Props {
		id: string;
		label: string;
		icon: Component;
		systemIcon: string;
		onclick: () => void;
		backgroundColor?: string;
		foregroundColor?: string;
		/** When true (default), replace the web button with the iOS 26 native button overlay. */
		native?: boolean;
	}

	let {
		id,
		label,
		icon: Icon,
		systemIcon,
		onclick,
		backgroundColor,
		foregroundColor,
		native = true
	}: Props = $props();

	function resolveColors() {
		return {
			bg: backgroundColor ?? readGuildVar('--guild-primary') ?? '#000000',
			fg: foregroundColor ?? readGuildVar('--guild-on-primary') ?? '#ffffff'
		};
	}

	function configure() {
		const { bg, fg } = resolveColors();
		void nativeButton.configure({
			id,
			title: label,
			edge: 'bottom',
			style: 'prominentGlass',
			fullWidth: true,
			systemIcon,
			fontWeight: 'semibold',
			visible: true,
			enabled: true,
			scrollEdgeEffect: true,
			backgroundColor: bg,
			foregroundColor: fg
		});
	}

	const overlay = useNativeOverlay({
		get native() {
			return native;
		},
		trackDeps: resolveColors,
		configure,
		hide: () => void nativeButton.hide?.(),
		attachListener: () =>
			nativeButton.addListener('tap', (event) => {
				if (event.id === id) onclick();
			})
	});
</script>

{#if !overlay.isActive}
	<button
		type="button"
		{onclick}
		class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-guild-on-primary shadow-[0_8px_40px_color-mix(in_srgb,rgb(0_0_0)_12%,transparent)] ring-(length:--guild-ring-width) ring-guild-ring"
	>
		<div class="flex items-center justify-center gap-3">
			<Icon class="size-6 text-guild-on-primary" />
			<span class="text-base font-semibold">{label}</span>
		</div>
	</button>
{/if}
