<script lang="ts">
	import { Ticket as TicketIcon, QrCode } from '@lucide/svelte';
	import { ArrowLeftRight, Receipt, PartyPopper } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';
	import TicketDetail from './TicketDetail.svelte';
	import ToolBar from './ToolBar.svelte';
	import { toolBar } from '$lib/plugins/toolBar/toolBar';
	import { tabsBar } from '$lib/plugins/tabsBar/tabsBar';
	import { navigationBar } from '$lib/plugins/navigationBar/navigationBar';
	import { isIos26Plus } from '$lib/platform/isIos26Plus';
	import { m } from '$lib/paraglide/messages.js';
	import { formatCardDate, formatTimeRange } from '$lib/format/datetime';
	import type { ToolBarNode } from '$lib/plugins/toolBar/definitions';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import type { Guild } from '$lib/types/guild';
	import { ticketQrPayload } from '$lib/api/validation';

	type Action = 'transfer' | 'wallet' | 'receipt' | 'activity';

	/**
	 * Prop names match the `lib/api/tickets.ts` `Ticket` shape so a
	 * caller can do `<Ticket {...ticket} name={…} />` without a
	 * view-model wrapper. The component handles date/time formatting
	 * and the display serial internally.
	 */
	interface Props {
		status?: string;
		activityTitle: string;
		creatorName: string;
		timeStart: Date;
		timeEnd: Date;
		location?: string;
		ticketKindName: string;
		id: string;
		name: string;
		qrData?: string;
		creatorGuild?: Guild;
		onAction?: (id: Action) => void;
		canFlip?: boolean;
		onRequestCenter?: () => void;
		offline?: boolean;
	}

	let {
		status,
		activityTitle,
		creatorName,
		timeStart,
		timeEnd,
		location,
		ticketKindName,
		id,
		name,
		qrData,
		creatorGuild,
		onAction,
		canFlip = true,
		onRequestCenter,
		offline = false
	}: Props = $props();

	const date = $derived(formatCardDate(timeStart));
	const time = $derived(formatTimeRange(timeStart, timeEnd));
	const serial = $derived(`#${id.slice(0, 8).toUpperCase()}`);
	let qrNow = $state(Date.now());
	const currentQrData = $derived(qrData ?? ticketQrPayload(id, qrNow));

	let showOverlay = $state(false);
	let overlayReady = $state(false);
	let originX = $state(0);
	let originY = $state(0);
	let originScale = $state(1);
	let targetX = $state(0);
	let targetY = $state(0);
	let showTools = $state(false);
	let isIos26Native = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let scrollLockSnapshot: { htmlOverflow: string; bodyOverflow: string } | undefined;
	let nativeToolBarListenerRemover: (() => void) | null = null;

	const tools = $derived([
		{
			id: 'transfer' as Action,
			icon: ArrowLeftRight,
			systemIcon: 'arrow.left.arrow.right',
			label: m.tool_transfer()
		},
		// { id: 'wallet' as Action, icon: Wallet, systemIcon: 'wallet.bifold', label: m.tool_wallet() },
		{ id: 'receipt' as Action, icon: Receipt, systemIcon: 'receipt', label: m.tool_receipt() },
		{
			id: 'activity' as Action,
			icon: PartyPopper,
			systemIcon: 'party.popper',
			label: m.tool_activity()
		}
	]);

	const W = 300;
	const H = 440;
	const TOP_H = H / 2;
	const R = 34;
	const D = 7;

	const path = `M ${R} 0 H ${W - R} A ${R} ${R} 0 0 1 ${W} ${R} V ${TOP_H - D} A ${D} ${D} 0 0 0 ${W} ${TOP_H + D} V ${H - R} A ${R} ${R} 0 0 1 ${W - R} ${H} H ${R} A ${R} ${R} 0 0 1 0 ${H - R} V ${TOP_H + D} A ${D} ${D} 0 0 0 0 ${TOP_H - D} V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;

	// group compact (button, button) - flex space - group compact (button, button)
	const nativeToolBarNodes: ToolBarNode[] = $derived([
		{
			type: 'group',
			spacing: 'compact',
			buttons: tools.slice(0, tools.length / 2).map((tool) => ({
				id: tool.id,
				title: tool.label,
				systemIcon: tool.systemIcon,
				style: 'plain'
			}))
		},
		{ type: 'flexible-space' },
		{
			type: 'group',
			spacing: 'compact',
			buttons: tools.slice(tools.length / 2).map((tool) => ({
				id: tool.id,
				title: tool.label,
				systemIcon: tool.systemIcon,
				style: 'plain'
			}))
		}
	]);

	function configureNativeToolBar(visible: boolean) {
		if (!isIos26Native || offline) return;
		void toolBar.configure({
			nodes: nativeToolBarNodes,
			visible
		});
	}

	function showNativeBars() {
		if (!isIos26Native) return;
		void tabsBar.hide();
		void navigationBar.hide();
	}

	function restoreNativeBars() {
		if (!isIos26Native) return;
		void tabsBar.show();
		void navigationBar.show();
	}

	function setShellNavbarHidden(hidden: boolean) {
		if (typeof document === 'undefined') return;
		document.documentElement.toggleAttribute('data-navbar-hidden', hidden);
	}

	function attachNativeToolBarListener() {
		if (!isIos26Native || nativeToolBarListenerRemover) return;

		void toolBar
			.addListener('buttonTap', (event) => {
				if (!event.id) return;
				onAction?.(event.id as Action);
			})
			.then((res) => {
				nativeToolBarListenerRemover = res.remove;
			});
	}

	function detachNativeToolBarListener() {
		nativeToolBarListenerRemover?.();
		nativeToolBarListenerRemover = null;
	}

	onMount(() => {
		const qrTimer = setInterval(() => (qrNow = Date.now()), 1_000);
		void (async () => {
			isIos26Native = await isIos26Plus();
		})();
		return () => clearInterval(qrTimer);
	});

	onDestroy(() => {
		setShellNavbarHidden(false);
		if (isIos26Native) {
			void toolBar.hide();
			detachNativeToolBarListener();
			restoreNativeBars();
		}
	});

	function openDetails() {
		if (!canFlip) {
			onRequestCenter?.();
			return;
		}
		const el = triggerEl;
		if (!el) return;

		const rect = el.getBoundingClientRect();
		originX = rect.left;
		originY = rect.top;
		originScale = rect.width / W;
		targetX = window.innerWidth / 2 + (W * 1.18) / 2;
		targetY = window.innerHeight / 2 - (H * 1.18) / 2;
		showTools = !isIos26Native && !offline;
		setShellNavbarHidden(true);
		if (isIos26Native && !offline) {
			showNativeBars();
			configureNativeToolBar(true);
			attachNativeToolBarListener();
			void toolBar.show();
		}
		if (!scrollLockSnapshot) {
			scrollLockSnapshot = {
				htmlOverflow: document.documentElement.style.overflow,
				bodyOverflow: document.body.style.overflow
			};
			document.documentElement.style.overflow = 'hidden';
			document.body.style.overflow = 'hidden';
		}

		showOverlay = true;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				overlayReady = true;
			});
		});

		void Haptics.impact({ style: ImpactStyle.Medium });
	}

	function closeDetails() {
		showTools = false;
		overlayReady = false;
		setShellNavbarHidden(false);
		if (isIos26Native) {
			void toolBar.hide();
			detachNativeToolBarListener();
			restoreNativeBars();
		}
		if (scrollLockSnapshot) {
			document.documentElement.style.overflow = scrollLockSnapshot.htmlOverflow;
			document.body.style.overflow = scrollLockSnapshot.bodyOverflow;
			scrollLockSnapshot = undefined;
		}
	}

	function onFlipTransitionEnd(e: TransitionEvent) {
		if (e.propertyName !== 'transform') return;
		if (overlayReady) return;
		showOverlay = false;
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		closeDetails();
	}

	function openAsModal(node: HTMLDialogElement) {
		node.showModal();

		return () => {
			if (node.open) node.close();
		};
	}

	function attachTrigger(node: HTMLButtonElement) {
		triggerEl = node;

		return () => {
			if (triggerEl === node) triggerEl = undefined;
		};
	}
</script>

{#snippet ticketFront()}
	<article class="absolute inset-0" style="clip-path: path('{path}');">
		<div
			class="absolute inset-x-0 top-0 flex flex-col gap-5 bg-guild-primary px-3.75 pt-5 text-guild-on-primary"
			style="height: {TOP_H}px;">
			<div class="flex items-center justify-between">
				<span
					class="rounded-full bg-guild-surface px-2.5 py-1.25 text-[11px] leading-none font-medium text-guild-on-surface">
					{status ?? m.ticket_status_active()}
				</span>
				<TicketIcon class="size-5" aria-hidden="true" />
			</div>

			<div class="flex flex-col gap-1">
				<h2 class="truncate text-[22px] leading-tight font-bold">{activityTitle}</h2>
				<p class="text-base leading-none opacity-90">{creatorName}</p>
			</div>

			<dl class="grid grid-cols-2 gap-y-3 text-sm">
				<div>
					<dt class="text-xs tracking-wide opacity-75">{m.ticket_label_date()}</dt>
					<dd class="font-semibold">{date}</dd>
				</div>
				<div>
					<dt class="text-xs tracking-wide opacity-75">{m.ticket_label_time()}</dt>
					<dd class="font-semibold">{time}</dd>
				</div>
				{#if location}
					<div class="col-span-2">
						<dt class="text-xs tracking-wide opacity-75">{m.ticket_label_location()}</dt>
						<dd class="font-semibold">{location}</dd>
					</div>
				{/if}
			</dl>
		</div>

		<div
			class="absolute inset-x-0 bottom-0 flex flex-col bg-white px-3.75 pt-4 text-guild-on-surface"
			style="height: {H - TOP_H}px;">
			<div class="grid grid-cols-2 gap-y-3 text-sm text-black">
				<div>
					<dt class="text-xs font-medium opacity-75">{m.ticket_label_addition()}</dt>
					<dd class="font-semibold">{ticketKindName}</dd>
				</div>
				<div class="text-right">
					<dt class="text-xs font-medium opacity-75">{m.ticket_label_serial()}</dt>
					<dd class="font-semibold">{serial}</dd>
				</div>
			</div>

			<div class="flex flex-1 flex-col items-center justify-center gap-1.25">
				<div
					class="flex size-14.5 items-center justify-center rounded-[10px] border border-gray-300 bg-gray-100 p-2.5">
					<QrCode class="size-full stroke-[1.5] text-gray-500" aria-hidden="true" />
				</div>
				<p class="text-sm text-gray-500">{m.ticket_tap_qr()}</p>
			</div>
		</div>

		<div
			class="absolute right-6 left-6 border-t-2 border-dashed border-guild-primary-light"
			style="top: {TOP_H}px;">
		</div>
	</article>
{/snippet}

{#snippet ticketBack()}
	<TicketDetail {name} activity={activityTitle} {serial} qrData={currentQrData} {offline} />
{/snippet}

<button
	type="button"
	data-guild={creatorGuild}
	{@attach attachTrigger}
	onclick={openDetails}
	class="block cursor-pointer rounded-[34px] border-0 bg-guild-primary-light p-0 text-left shadow-[0_8px_40px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)] [-webkit-tap-highlight-color:transparent] focus:outline-none"
	class:invisible={showOverlay}
	style="width: calc({W}px * var(--ticket-scale, 1)); height: calc({H}px * var(--ticket-scale, 1));">
	<div
		class="relative origin-top-left"
		style="width: {W}px; height: {H}px; transform: scale(var(--ticket-scale, 1));">
		{@render ticketFront()}
	</div>
</button>

{#if showOverlay}
	<dialog
		data-guild={creatorGuild}
		class="fixed inset-0 z-60 m-0 block h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0 backdrop:bg-transparent"
		oncancel={handleCancel}
		aria-label={m.modal_close_label()}
		{@attach openAsModal}>
		<button
			type="button"
			aria-label={m.modal_close_label()}
			onclick={closeDetails}
			class="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-280 ease-in"
			class:opacity-100={overlayReady}></button>

		<div class="pointer-events-none absolute inset-0 perspective-[1800px]">
			<div
				class="ticket-flip pointer-events-auto absolute top-0 left-0 h-110 w-75 origin-[center_left] transition-transform duration-560 ease-[cubic-bezier(0.22,0.61,0.36,1)] will-change-transform transform-3d"
				class:ticket-flip-open={overlayReady}
				ontransitionend={onFlipTransitionEnd}
				style={`--origin-x:${originX}px; --origin-y:${originY}px; --origin-scale:${originScale}; --target-x:${targetX}px; --target-y:${targetY}px;`}>
				<div class="absolute inset-0 backface-hidden" aria-hidden={overlayReady}>
					{@render ticketFront()}
				</div>
				<div
					class="absolute inset-0 transform-[rotateY(180deg)] backface-hidden"
					aria-hidden={!overlayReady}>
					{@render ticketBack()}
				</div>
			</div>
		</div>

		{#if !isIos26Native && !offline}
			<div
				class="absolute bottom-[max(env(safe-area-inset-bottom),1.5rem)] left-1/2 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-180 ease-in"
				class:opacity-100={showTools}
				class:translate-y-0={showTools}
				class:pointer-events-none={!showTools}
				class:pointer-events-auto={showTools}>
				<ToolBar items={tools} onAction={(id) => onAction?.(id)} />
			</div>
		{/if}
	</dialog>
{/if}

<style>
	.ticket-flip {
		transform: translate(var(--origin-x), var(--origin-y)) scale(var(--origin-scale)) rotateY(0deg);
	}

	.ticket-flip.ticket-flip-open {
		transform: translate(var(--target-x), var(--target-y)) scale(1.18) rotateY(180deg);
	}
</style>
