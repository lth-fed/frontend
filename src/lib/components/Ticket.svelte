<script lang="ts">
	import { Ticket as TicketIcon, QrCode } from '@lucide/svelte';

	interface Props {
		state?: string;
		title: string;
		subtitle: string;
		date: string;
		time: string;
		location?: string;
		addition?: string;
		serial: string;
	}

	let {
		state = 'ACTIVE',
		title,
		subtitle,
		date,
		time,
		location,
		addition,
		serial
	}: Props = $props();

	const W = 300;
	const H = 470;
	const TOP_H = 270;
	const R = 24;
	const D = 12;

	const path = `M ${R} 0 H ${W - R} A ${R} ${R} 0 0 1 ${W} ${R} V ${TOP_H - D} A ${D} ${D} 0 0 0 ${W} ${TOP_H + D} V ${H - R} A ${R} ${R} 0 0 1 ${W - R} ${H} H ${R} A ${R} ${R} 0 0 1 0 ${H - R} V ${TOP_H + D} A ${D} ${D} 0 0 0 0 ${TOP_H - D} V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;
</script>

<div class="relative" style="width: {W}px; height: {H}px;">
	<article
		class="absolute inset-0"
		style="clip-path: path('{path}'); filter: drop-shadow(0 14px 22px rgb(0 0 0 / 0.14));"
	>
		<div
			class="bg-guild-primary text-guild-on-primary absolute inset-x-0 top-0 px-6 pt-5 pb-8"
			style="height: {TOP_H}px;"
		>
			<div class="flex items-start justify-between">
				<span
					class="bg-guild-surface text-guild-on-surface rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
				>
					{state}
				</span>
				<TicketIcon class="size-6 opacity-90" aria-hidden="true" />
			</div>

			<h2 class="mt-5 text-3xl leading-tight font-bold">{title}</h2>
			<p class="mt-1 text-lg opacity-90">{subtitle}</p>

			<dl class="mt-6 grid grid-cols-2 gap-y-3 text-sm">
				<div>
					<dt class="text-[11px] tracking-wide opacity-75">DATE</dt>
					<dd class="font-bold">{date}</dd>
				</div>
				<div>
					<dt class="text-[11px] tracking-wide opacity-75">TIME</dt>
					<dd class="font-bold">{time}</dd>
				</div>
				{#if location}
					<div class="col-span-2">
						<dt class="text-[11px] tracking-wide opacity-75">LOCATION</dt>
						<dd class="font-bold">{location}</dd>
					</div>
				{/if}
			</dl>
		</div>

		<div
			class="bg-guild-surface text-guild-on-surface absolute inset-x-0 bottom-0 px-6 pt-[17px] pb-7"
			style="height: {H - TOP_H}px;"
		>
			<div class="grid grid-cols-2 gap-y-3 text-sm">
				<div>
					<dt class="text-guild-accent text-[11px] tracking-wide">ADDITION</dt>
					<dd class="font-bold">{addition ?? '—'}</dd>
				</div>
				<div class="text-right">
					<dt class="text-guild-accent text-[11px] tracking-wide">SERIAL</dt>
					<dd class="font-bold">{serial}</dd>
				</div>
			</div>

			<div class="mt-8 flex flex-col items-center gap-2">
				<div class="bg-guild-primary-light flex size-16 items-center justify-center rounded-2xl">
					<QrCode class="text-guild-on-surface size-9" aria-hidden="true" />
				</div>
				<p class="text-guild-accent text-sm">Tap to view QR</p>
			</div>
		</div>

		<div
			class="border-guild-primary-light absolute right-6 left-6 border-t-2 border-dashed"
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
