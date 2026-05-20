<script lang="ts">
	import { Ticket as TicketIcon, QrCode } from '@lucide/svelte';
	import { ArrowLeftRight, Wallet, Receipt, PartyPopper } from '@lucide/svelte';
	import TicketDetail from './TicketDetail.svelte';
	import ToolBar from './ToolBar.svelte';
	import { m } from '$lib/paraglide/messages.js';

	type Action = 'transfer' | 'wallet' | 'receipt' | 'event';

	interface Props {
		status?: string;
		title: string;
		subtitle: string;
		date: string;
		time: string;
		location?: string;
		addition?: string;
		serial: string;
		name: string;
		qrData?: string;
		onAction?: (id: Action) => void;
		canFlip?: boolean;
		onRequestCenter?: () => void;
	}

	let {
		status,
		title,
		subtitle,
		date,
		time,
		location,
		addition,
		serial,
		name,
		qrData,
		onAction,
		canFlip = true,
		onRequestCenter
	}: Props = $props();

	let showOverlay = $state(false);
	let overlayReady = $state(false);
	let originX = $state(0);
	let originY = $state(0);
	let originScale = $state(1);
	let targetX = $state(0);
	let targetY = $state(0);
	let showTools = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let scrollLockSnapshot: { htmlOverflow: string; bodyOverflow: string } | undefined;

	const tools = $derived([
		{ id: 'transfer' as Action, icon: ArrowLeftRight, label: m.tool_transfer() },
		{ id: 'wallet' as Action, icon: Wallet, label: m.tool_wallet() },
		{ id: 'receipt' as Action, icon: Receipt, label: m.tool_receipt() },
		{ id: 'event' as Action, icon: PartyPopper, label: m.tool_event() }
	]);

	const W = 300;
	const H = 440;
	const TOP_H = H / 2;
	const R = 34;
	const D = 7;

	const path = `M ${R} 0 H ${W - R} A ${R} ${R} 0 0 1 ${W} ${R} V ${TOP_H - D} A ${D} ${D} 0 0 0 ${W} ${TOP_H + D} V ${H - R} A ${R} ${R} 0 0 1 ${W - R} ${H} H ${R} A ${R} ${R} 0 0 1 0 ${H - R} V ${TOP_H + D} A ${D} ${D} 0 0 0 0 ${TOP_H - D} V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;

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
		showTools = false;
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
	}

	function closeDetails() {
		showTools = false;
		overlayReady = false;
		if (scrollLockSnapshot) {
			document.documentElement.style.overflow = scrollLockSnapshot.htmlOverflow;
			document.body.style.overflow = scrollLockSnapshot.bodyOverflow;
			scrollLockSnapshot = undefined;
		}
	}

	function onFlipTransitionEnd(e: TransitionEvent) {
		if (e.propertyName !== 'transform') return;
		if (overlayReady) {
			showTools = true;
			return;
		}
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
			style="height: {TOP_H}px;"
		>
			<div class="flex items-center justify-between">
				<span
					class="rounded-full bg-guild-surface px-2.5 py-1.25 text-[11px] leading-none font-medium text-guild-on-surface"
				>
					{status ?? m.ticket_status_active()}
				</span>
				<TicketIcon class="size-5" aria-hidden="true" />
			</div>

			<div class="flex flex-col gap-1.5">
				<h2 class="truncate text-[22px] leading-none font-bold">{title}</h2>
				<p class="text-base leading-none opacity-90">{subtitle}</p>
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
			style="height: {H - TOP_H}px;"
		>
			<div class="grid grid-cols-2 gap-y-3 text-sm text-black">
				<div>
					<dt class="text-xs font-medium opacity-75">{m.ticket_label_addition()}</dt>
					<dd class="font-semibold">{addition ?? '—'}</dd>
				</div>
				<div class="text-right">
					<dt class="text-xs font-medium opacity-75">{m.ticket_label_serial()}</dt>
					<dd class="font-semibold">{serial}</dd>
				</div>
			</div>

			<div class="flex flex-1 flex-col items-center justify-center gap-1.25">
				<div
					class="flex size-14.5 items-center justify-center rounded-[10px] border border-gray-300 bg-gray-100 p-2.5"
				>
					<QrCode class="size-full stroke-[1.5] text-gray-500" aria-hidden="true" />
				</div>
				<p class="text-sm text-gray-500">{m.ticket_tap_qr()}</p>
			</div>
		</div>

		<div
			class="absolute right-6 left-6 border-t-2 border-dashed border-guild-primary-light"
			style="top: {TOP_H}px;"
		></div>
	</article>
{/snippet}

{#snippet ticketBack()}
	<TicketDetail {name} event={title} {serial} qrData={qrData ?? serial} />
{/snippet}

<button
	type="button"
	{@attach attachTrigger}
	onclick={openDetails}
	class="block cursor-pointer rounded-[34px] border-0 bg-guild-primary-light p-0 text-left shadow-[0_8px_40px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)] [-webkit-tap-highlight-color:transparent] focus:outline-none"
	class:invisible={showOverlay}
	style="width: calc({W}px * var(--ticket-scale, 1)); height: calc({H}px * var(--ticket-scale, 1));"
>
	<div
		class="relative origin-top-left"
		style="width: {W}px; height: {H}px; transform: scale(var(--ticket-scale, 1));"
	>
		{@render ticketFront()}
	</div>
</button>

{#if showOverlay}
	<dialog
		class="ticket-overlay z-60"
		oncancel={handleCancel}
		aria-label={m.modal_close_label()}
		{@attach openAsModal}
	>
		<button
			type="button"
			aria-label={m.modal_close_label()}
			onclick={closeDetails}
			class="ticket-backdrop absolute inset-0"
			class:is-open={overlayReady}
		></button>

		<div class="pointer-events-none absolute inset-0 perspective-[1800px]">
			<div
				class="ticket-flip"
				class:is-open={overlayReady}
				ontransitionend={onFlipTransitionEnd}
				style={`--origin-x:${originX}px; --origin-y:${originY}px; --origin-scale:${originScale}; --target-x:${targetX}px; --target-y:${targetY}px;`}
			>
				<div class="ticket-face front" aria-hidden={overlayReady}>
					{@render ticketFront()}
				</div>
				<div class="ticket-face back" aria-hidden={!overlayReady}>
					{@render ticketBack()}
				</div>
			</div>
		</div>

		<div class="ticket-tools" class:is-visible={showTools}>
			<ToolBar items={tools} onAction={(id) => onAction?.(id)} />
		</div>
	</dialog>
{/if}

<style>
	.ticket-overlay {
		position: fixed;
		inset: 0;
		display: block;
		margin: 0;
		padding: 0;
		border: 0;
		width: 100dvw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		background: transparent;
	}

	.ticket-backdrop {
		opacity: 0;
		background: rgb(0 0 0 / 0.5);
		transition: opacity 280ms ease;
	}

	.ticket-backdrop.is-open {
		opacity: 1;
	}

	.ticket-flip {
		position: absolute;
		top: 0;
		left: 0;
		width: 300px;
		height: 440px;
		pointer-events: auto;
		transform-origin: center left;
		transform-style: preserve-3d;
		transform: translate(var(--origin-x), var(--origin-y)) scale(var(--origin-scale)) rotateY(0deg);
		transition: transform 560ms cubic-bezier(0.22, 0.61, 0.36, 1);
		will-change: transform;
	}

	.ticket-flip.is-open {
		transform: translate(var(--target-x), var(--target-y)) scale(1.18) rotateY(180deg);
	}

	.ticket-face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
	}

	.ticket-face.back {
		transform: rotateY(180deg);
	}

	.ticket-tools {
		position: absolute;
		left: 50%;
		bottom: env(safe-area-inset-bottom);
		transform: translate(-50%, 8px);
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 180ms ease,
			transform 180ms ease;
	}

	.ticket-tools.is-visible {
		opacity: 1;
		transform: translate(-50%, 0);
		pointer-events: auto;
	}

	.ticket-overlay::backdrop {
		background: transparent;
	}
</style>
