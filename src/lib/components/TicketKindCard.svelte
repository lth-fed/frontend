<script lang="ts">
	import { TicketIcon } from '@lucide/svelte';
	import { formatPrice } from '$lib/format/money';

	interface Props {
		name: string;
		/** Price in öre. Rendered via `formatPrice` (0 → "Gratis"/"Free"). */
		price: number;
		onclick?: () => void;
	}

	let { name, price, onclick }: Props = $props();
</script>

<button
	type="button"
	{onclick}
	class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
>
	<div
		class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface"
	>
		<TicketIcon class="size-5" aria-hidden="true" />
	</div>
	<span class="flex-1 text-[16px] font-medium text-guild-on-surface">{name}</span>
	<span class="text-[16px] font-semibold text-guild-on-surface">
		{formatPrice(price)}
	</span>
</button>
