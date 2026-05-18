<script lang="ts">
	import { Ticket as TicketIcon, QrCode } from '@lucide/svelte';
	import TicketModal from './TicketModal.svelte';
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
		onAction
	}: Props = $props();

	let open = $state(false);

	const W = 300;
	const H = 470;
	const TOP_H = 270;
	const R = 24;
	const D = 18;

	const path = `M ${R} 0 H ${W - R} A ${R} ${R} 0 0 1 ${W} ${R} V ${TOP_H - D} A ${D} ${D} 0 0 0 ${W} ${TOP_H + D} V ${H - R} A ${R} ${R} 0 0 1 ${W - R} ${H} H ${R} A ${R} ${R} 0 0 1 0 ${H - R} V ${TOP_H + D} A ${D} ${D} 0 0 0 0 ${TOP_H - D} V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;
</script>

<button
	type="button"
	onclick={() => (open = true)}
	class="block cursor-pointer border-0 bg-transparent p-0 text-left [-webkit-tap-highlight-color:transparent] focus:outline-none"
	style="width: calc({W}px * var(--ticket-scale, 1)); height: calc({H}px * var(--ticket-scale, 1));"
>
	<div
		class="relative origin-top-left"
		style="width: {W}px; height: {H}px; transform: scale(var(--ticket-scale, 1));"
	>
		<article
			class="absolute inset-0"
			style="clip-path: path('{path}'); filter: drop-shadow(0 14px 22px rgb(0 0 0 / 0.14));"
		>
			<div
				class="absolute inset-x-0 top-0 flex flex-col bg-guild-primary px-6 pt-5 pb-4 text-guild-on-primary"
				style="height: {TOP_H}px;"
			>
				<div class="flex items-start justify-between">
					<span
						class="rounded-full bg-guild-surface px-3 py-1 text-[11px] font-bold tracking-wide text-guild-on-surface"
					>
						{status ?? m.ticket_status_active()}
					</span>
					<TicketIcon class="size-6 opacity-90" aria-hidden="true" />
				</div>

				<h2 class="mt-5 line-clamp-2 text-3xl leading-tight font-bold break-words">{title}</h2>
				<p class="mt-1 text-lg opacity-90">{subtitle}</p>

				<dl class="mt-auto grid grid-cols-2 gap-y-3 text-sm">
					<div>
						<dt class="text-[11px] tracking-wide opacity-75">{m.ticket_label_date()}</dt>
						<dd class="font-bold">{date}</dd>
					</div>
					<div>
						<dt class="text-[11px] tracking-wide opacity-75">{m.ticket_label_time()}</dt>
						<dd class="font-bold">{time}</dd>
					</div>
					{#if location}
						<div class="col-span-2">
							<dt class="text-[11px] tracking-wide opacity-75">{m.ticket_label_location()}</dt>
							<dd class="font-bold">{location}</dd>
						</div>
					{/if}
				</dl>
			</div>

			<div
				class="absolute inset-x-0 bottom-0 bg-guild-surface px-6 pt-[17px] pb-7 text-guild-on-surface"
				style="height: {H - TOP_H}px;"
			>
				<div class="grid grid-cols-2 gap-y-3 text-sm">
					<div>
						<dt class="text-[11px] tracking-wide text-guild-accent">{m.ticket_label_addition()}</dt>
						<dd class="font-bold">{addition ?? '—'}</dd>
					</div>
					<div class="text-right">
						<dt class="text-[11px] tracking-wide text-guild-accent">{m.ticket_label_serial()}</dt>
						<dd class="font-bold">{serial}</dd>
					</div>
				</div>

				<div class="mt-8 flex flex-col items-center gap-2">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-guild-primary-light">
						<QrCode class="size-9 text-guild-on-surface" aria-hidden="true" />
					</div>
					<p class="text-sm text-guild-accent">{m.ticket_tap_qr()}</p>
				</div>
			</div>

			<div
				class="absolute right-6 left-6 border-t-2 border-dashed border-guild-primary-light"
				style="top: {TOP_H}px;"
			></div>
		</article>

		<svg
			class="pointer-events-none absolute inset-0"
			viewBox="0 0 {W} {H}"
			preserveAspectRatio="none"
			style="overflow: visible;"
		>
			<path
				d={path}
				fill="none"
				vector-effect="non-scaling-stroke"
				style="stroke: var(--guild-ring); stroke-width: var(--guild-ring-width);"
			/>
		</svg>
	</div>
</button>

<TicketModal
	{open}
	{name}
	event={title}
	{serial}
	qrData={qrData ?? serial}
	onClose={() => (open = false)}
	{onAction}
/>
