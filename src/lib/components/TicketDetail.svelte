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

<article class="rounded-2xl bg-white px-6 py-8 shadow-md">
	<header class="flex items-start gap-6">
		<div class="min-w-0 flex-1">
			<p class="text-[11px] tracking-wide text-gray-500">{m.ticket_detail_label_name()}</p>
			<p class="mt-1 line-clamp-2 text-base font-bold break-words text-gray-900">{name}</p>
		</div>
		<div class="min-w-0 flex-1 text-right">
			<p class="text-[11px] tracking-wide text-gray-500">{m.ticket_detail_label_event()}</p>
			<p class="mt-1 line-clamp-2 text-base font-bold break-words text-gray-900">{event}</p>
		</div>
	</header>

	<div class="mt-8 flex justify-center">
		<QrCode data={qrData} />
	</div>

	<p class="mt-6 text-center text-sm text-gray-500">{serial}</p>
</article>
