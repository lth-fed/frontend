<script lang="ts">
	import QrCode from './QrCode.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		name: string;
		activity: string;
		serial: string;
		qrData: string;
		offline?: boolean;
	}

	let { name, activity, serial, qrData, offline = false }: Props = $props();
</script>

<article
	class="flex size-full flex-col items-center justify-center gap-3.75 rounded-[34px] border border-gray-200 bg-white">
	<header class="flex w-full items-start justify-between gap-3 px-7.5 pt-3.75 pb-7.5">
		<div class="flex min-w-0 flex-1 flex-col gap-px">
			<p class="text-xs text-gray-600">{m.ticket_detail_label_name()}</p>
			<p class="text-sm font-medium break-words text-black">{name}</p>
		</div>
		<div class="flex min-w-0 flex-1 flex-col gap-px text-right">
			<p class="text-xs text-gray-600">{m.ticket_detail_label_activity()}</p>
			<p class="text-sm font-medium break-words text-black">{activity}</p>
		</div>
	</header>

	<div class="flex justify-center">
		<QrCode data={qrData} />
	</div>

	<p class="text-center text-sm font-medium text-gray-600">{serial}</p>
	{#if offline}
		<p class="px-6 text-center text-xs text-amber-800">{m.offline_ticket_actions()}</p>
	{/if}
</article>
