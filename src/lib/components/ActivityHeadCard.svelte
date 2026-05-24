<script lang="ts">
	import { CalendarIcon, MapPinIcon } from '@lucide/svelte';
	import InfoRow from './InfoRow.svelte';

	interface Props {
		badge?: string;
		title: string;
		date: string;
		time: string;
		location: string;
	}

	let { badge, title, date, time, location }: Props = $props();
</script>

<div
	class="flex w-full flex-col gap-5 rounded-[34px] bg-white/80 px-6 pt-6 pb-7 shadow-[0_8px_40px_color-mix(in_srgb,var(--color-guild-primary)_12%,transparent)] ring-1 ring-gray-200 backdrop-blur-md"
>
	{#if badge}
		<div
			class="w-fit rounded-full bg-white px-2 py-1.5 text-[10px] font-semibold text-guild-on-surface"
		>
			{badge}
		</div>
	{/if}
	<h1 class="text-[26px] font-bold">{title}</h1>
	<div class="flex flex-col gap-3 pt-1">
		<InfoRow icon={CalendarIcon} label={date} sublabel={time} />
		<InfoRow icon={MapPinIcon} label={location} />
	</div>
</div>
