<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { navigationBar } from '$lib/plugins/navigationBar/navigationBar';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';
	import '$lib/state/locale.svelte';
	import Avatar from './Avatar.svelte';
	import type { TopBarSlot } from '$lib/state/appBars.svelte';

	interface Props {
		leading?: TopBarSlot | null;
		trailing?: TopBarSlot | null;
		title?: string;
		/** When true (default), replace the web header with the iOS 26 native navigation bar. */
		native?: boolean;
	}

	let { leading = null, trailing = null, title = '', native = true }: Props = $props();

	let isIos26Native = $state(false);
	let listenerRemover: (() => void) | null = null;

	function nativeButtonFor(slot: TopBarSlot | null, id: string) {
		if (!slot) return null;
		return { id, systemIcon: slot.systemIcon, style: 'plain' as const };
	}

	onMount(() => {
		if (!native) return;

		void (async () => {
			isIos26Native = await isIos26Plus();
			if (!isIos26Native) return;

			navigationBar.configure({
				title,
				backButton: nativeButtonFor(leading, 'leading'),
				actionButton: nativeButtonFor(trailing, 'trailing'),
				visible: true
			});

			navigationBar
				.addListener('navigationBarAction', (event) => {
					if (event.type === 'back') leading?.onclick?.();
					else if (event.type === 'action') trailing?.onclick?.();
				})
				.then((res) => {
					listenerRemover = res.remove;
				});
		})();
	});

	$effect(() => {
		if (!isIos26Native) return;
		void navigationBar.setTitle({ title });
	});

	$effect(() => {
		if (!isIos26Native) return;
		const back = nativeButtonFor(leading, 'leading');
		if (back) void navigationBar.setBackButton(back);
		const action = nativeButtonFor(trailing, 'trailing');
		if (action) void navigationBar.setActionButton(action);
	});

	onDestroy(() => {
		if (isIos26Native) navigationBar.hide?.();
		listenerRemover?.();
	});
</script>

{#snippet renderSlot(slot: TopBarSlot)}
	{#if slot.kind === 'avatar'}
		<Avatar userId={slot.userId} onclick={slot.onclick} label={slot.label ?? ''} />
	{:else}
		{@const Icon = slot.icon}
		<button
			type="button"
			aria-label={slot.label}
			onclick={slot.onclick}
			class="flex size-11 items-center justify-center">
			<Icon class={slot.iconClass ?? 'size-7 text-guild-accent'} aria-hidden="true" />
		</button>
	{/if}
{/snippet}

{#if !isIos26Native}
	<header
		class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-guild-surface px-6 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 shadow-sm">
		<div class="justify-self-start">
			{#if leading}{@render renderSlot(leading)}{/if}
		</div>
		<div class="justify-self-center">
			{#if title}<h1 class="text-base font-bold text-guild-on-surface">{title}</h1>{/if}
		</div>
		<div class="justify-self-end">
			{#if trailing}{@render renderSlot(trailing)}{/if}
		</div>
	</header>
{/if}
