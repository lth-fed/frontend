<script lang="ts">
	import type { Component } from 'svelte';
	import { nativeButton } from '$lib/plugins/nativeButton/nativeButton';
	import { useNativeOverlay } from '$lib/plugins/useNativeOverlay.svelte';
	import { readGuildVar } from '$lib/state/guildColors.svelte';
	import { locale } from '$lib/state/locale.svelte';

	interface Props {
		id: string;
		label: string;
		icon: Component;
		systemIcon: string;
		onclick: () => void;
		disabled?: boolean;
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
		disabled = false,
		backgroundColor,
		foregroundColor,
		native = true
	}: Props = $props();

	function resolveColors() {
		void locale.current;
		return {
			bg: disabled ? '#d1d5db' : (backgroundColor ?? readGuildVar('--guild-primary') ?? '#000000'),
			fg: disabled
				? '#4b5563'
				: (foregroundColor ?? readGuildVar('--guild-on-primary') ?? '#ffffff')
		};
	}

	function configure() {
		const { bg, fg } = resolveColors();
		void nativeButton.configure({
			id,
			title: label,
			edge: 'bottom',
			style: disabled ? 'bordered' : 'prominentGlass',
			fullWidth: true,
			systemIcon,
			fontWeight: 'semibold',
			visible: true,
			enabled: !disabled,
			scrollEdgeEffect: true,
			backgroundColor: bg,
			foregroundColor: fg
		});
	}

	const overlay = useNativeOverlay({
		get native() {
			return native;
		},
		trackDeps: () => {
			void id;
			void label;
			void systemIcon;
			void onclick;
			void disabled;
			return resolveColors();
		},
		configure,
		hide: () => void nativeButton.hide?.(),
		attachListener: () =>
			nativeButton.addListener('tap', (event) => {
				if (event.id === id && !disabled) onclick();
			})
	});
</script>

{#if !overlay.isActive}
	<button
		type="button"
		{onclick}
		{disabled}
		class="w-full rounded-full border-2 px-5 py-3.5 shadow-[0_8px_40px_color-mix(in_srgb,rgb(0_0_0)_12%,transparent)] ring-(length:--guild-ring-width) disabled:cursor-not-allowed disabled:shadow-none"
		class:border-transparent={!disabled}
		class:border-gray-500={disabled}
		class:bg-guild-primary={!disabled}
		class:text-guild-on-primary={!disabled}
		class:ring-guild-ring={!disabled}
		class:bg-gray-300={disabled}
		class:text-gray-600={disabled}
		class:ring-gray-300={disabled}>
		<div class="flex items-center justify-center gap-3">
			<Icon class="size-6" />
			<span class="text-base font-semibold">{label}</span>
		</div>
	</button>
{/if}
