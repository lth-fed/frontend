<script lang="ts">
	import { Bell, BellOff, CalendarIcon, MapPinIcon } from '@lucide/svelte';
	import InfoRow from './InfoRow.svelte';
	import { m } from '$lib/paraglide/messages.js'

	interface Props {
		badge?: string;
		title: string;
		date: string;
		time: string;
		location: string;
		followed?: boolean;
		followBusy?: boolean;
		followToggle?: () => void;
	}

	let { badge, title, date, time, location, followed, followBusy, followToggle }: Props = $props();
</script>

<div
	class="flex w-full flex-col gap-5 rounded-[34px] bg-white/80 px-6 pt-6 pb-7 shadow-[0_8px_40px_color-mix(in_srgb,var(--color-guild-primary)_12%,transparent)] ring-1 ring-gray-200 backdrop-blur-md">
	{#if badge}
		<div
			class="w-fit rounded-full bg-white px-2 py-1.5 text-[10px] font-semibold text-guild-on-surface">
			{badge}
		</div>
	{/if}
	<h1 class="text-[26px] font-bold">{title}</h1>
	<div class="grid grid-cols-[1fr_auto] gap-3 pt-1">
		<InfoRow icon={CalendarIcon} label={date} sublabel={time} />
		{#if location}
			<InfoRow icon={MapPinIcon} label={location} />
		{/if}
		{#if followBusy !== undefined && followed !== undefined && followToggle !== undefined}
			<button
				type="button"
				disabled={followBusy}
				onclick={() => followToggle()}
				aria-label={followed ? m.activity_unfollow() : m.activity_follow()}
				title={followed ? m.activity_unfollow() : m.activity_follow()}
				class="col-start-2 row-start-1 row-span-2 self-end grid m-1 size-11 place-items-center rounded-full bg-guild-surface text-guild-on-surface shadow-sm disabled:opacity-60">
				{#if followed}
					<BellOff class="size-5" aria-hidden="true" />
				{:else}
					<Bell class="size-5" aria-hidden="true" />
				{/if}
			</button>
		{/if}
	</div>
</div>
