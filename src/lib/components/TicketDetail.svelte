<script lang="ts">
	import QrCode from './QrCode.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		name: string;
		event: string;
		serial: string;
		qrData: string;
	}

	let { name, event, serial, qrData }: Props = $props();
</script>

<article
	class="flex size-full flex-col items-center justify-center gap-3.75 rounded-[34px] border border-gray-200 bg-white"
>
	<header class="flex w-full items-center justify-between px-7.5 pt-3.75 pb-7.5">
		<div class="flex flex-col items-start gap-px">
			<p class="w-fit text-xs text-gray-600">{m.ticket_detail_label_name()}</p>
			<p class="w-fit text-sm font-medium text-black">{name}</p>
		</div>
		<div class="flex flex-col items-end gap-px">
			<p class="w-fit text-xs text-gray-600">{m.ticket_detail_label_event()}</p>
			<p class="w-fit text-sm font-medium text-black">{event}</p>
		</div>
	</header>

	<div class="flex justify-center">
		<QrCode data={qrData} />
	</div>

	<p class="text-center text-sm font-medium text-gray-600">{serial}</p>
</article>
