<script lang="ts">
	import { QrCode as QrIcon } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		data: string;
		size?: number;
	}

	let { data, size = 200 }: Props = $props();
</script>

<div
	role="img"
	aria-label={m.qr_code_alt()}
	data-qr={data}
	class="flex items-center justify-center rounded-lg bg-gray-100"
	style="width: {size}px; height: {size}px;"
>
	<QrIcon class="size-1/2 text-gray-400" aria-hidden="true" />
</div>
