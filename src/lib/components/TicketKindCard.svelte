<script lang="ts">
	import { TicketIcon } from '@lucide/svelte';
	import { formatPrice } from '$lib/format/money';
	import { formatShortDateTime } from '$lib/format/datetime';
	import { m } from '$lib/paraglide/messages.js';
	import type { KindState } from '$lib/purchase/kindState';

	interface Props {
		name: string;
		/** Price in öre. Rendered via `formatPrice` (0 → "Gratis"/"Free"). */
		price: number;
		/** Purchasability, derived via `deriveKindState` (spec §4.6). */
		state: KindState;
		/** Inline error from the last purchase attempt on this kind —
		 *  the backend's user-facing 400 message (spec §7). */
		error?: string;
		/** A purchase for this kind is in flight. */
		busy?: boolean;
		/** This kind is the one in the active purchase flow. */
		inFlow?: boolean;
		/** Some purchase flow is active (one at a time, spec §4.5). */
		flowActive?: boolean;
		onclick?: () => void;
	}

	let {
		name,
		price,
		state,
		error,
		busy = false,
		inFlow = false,
		flowActive = false,
		onclick
	}: Props = $props();

	// Every kind (free included) goes through the purchase machine:
	// actionable when open, inside the 10-min entry window, and when sold
	// out (reservation queue) — spec §4.2.
	const joinable = $derived(
		state.state === 'open' || state.state === 'window' || state.state === 'sold-out'
	);
	const enabled = $derived(joinable && !busy && !flowActive);

	const statusLabel = $derived.by(() => {
		switch (state.state) {
			case 'window':
				return m.purchase_join_release();
			case 'not-yet':
				return m.purchase_releases_at({ datetime: formatShortDateTime(state.releaseAt) });
			case 'closed':
				return m.purchase_closed();
			case 'sold-out':
				return m.purchase_join_queue();
			case 'open':
				return undefined;
		}
	});
</script>

<button
	type="button"
	onclick={enabled ? onclick : undefined}
	disabled={!enabled}
	class="flex w-full flex-col gap-2 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)] disabled:shadow-none"
	class:opacity-60={!enabled && !busy && !inFlow}
	class:ring-2={inFlow}
	class:ring-guild-ring={inFlow}>
	<span class="flex w-full items-center gap-4">
		<span
			class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface">
			<TicketIcon class="size-5" aria-hidden="true" />
		</span>
		<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
			{name}
			{#if state.state === 'open' && state.ticketsLeft !== undefined}
				<span
					class="ml-1 rounded-full bg-guild-primary-light px-2 py-0.5 text-xs font-semibold text-guild-on-surface">
					{m.purchase_left({ count: state.ticketsLeft })}
				</span>
			{/if}
		</span>
		{#if busy}
			<span
				class="size-5 animate-spin rounded-full border-2 border-guild-primary border-t-transparent"
				role="status"
				aria-label={m.purchase_in_progress()}></span>
		{:else if statusLabel}
			<span class="text-sm font-semibold text-guild-on-surface/70">{statusLabel}</span>
		{:else}
			<span class="text-[16px] font-semibold text-guild-on-surface">
				{formatPrice(price)}
			</span>
		{/if}
	</span>
	{#if error}
		<p class="w-full text-sm text-red-700" role="alert">{error}</p>
	{/if}
</button>
