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
	class="flex size-full flex-col items-center justify-center gap-[15px] overflow-hidden rounded-[34px] border border-gray-200 bg-white">
	<header class="flex w-full items-start justify-between gap-[12px] px-[30px] pt-[15px] pb-[30px]">
		<div class="flex min-w-0 flex-1 flex-col gap-px">
			<p class="text-[12px] text-gray-600">{m.ticket_detail_label_name()}</p>
			<p class="wrap-break-words text-[14px] font-medium text-black">{name}</p>
		</div>
		<div class="flex min-w-0 flex-1 flex-col gap-px text-right">
			<p class="text-[12px] text-gray-600">{m.ticket_detail_label_activity()}</p>
			<p class="wrap-break-words text-[14px] font-medium text-black">{activity}</p>
		</div>
	</header>

	<div class="flex shrink-0 justify-center">
		<QrCode data={qrData} />
	</div>

	<p class="text-center text-[14px] font-medium text-gray-600">{serial}</p>
	{#if offline}
		<p class="px-[24px] text-center text-[12px] text-amber-800">{m.offline_ticket_actions()}</p>
	{/if}
</article>
