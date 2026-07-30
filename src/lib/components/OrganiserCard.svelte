<script lang="ts">
	import { guilds } from '$lib/data/guilds';
	import type { Guild } from '$lib/types/guild';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		guild: Guild;
		onFollow?: () => void;
	}

	let { guild, onFollow }: Props = $props();
	const info = $derived(guilds[guild]);
</script>

<div
	data-guild={guild}
	class="flex w-full items-center gap-3 rounded-3xl border border-gray-100 bg-guild-primary-light p-4 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
	<img src={info.logo} alt="" class="size-10 shrink-0 object-contain" />
	<span class="w-full text-[16px] font-medium text-guild-on-surface">{info.name}</span>
	<button type="button" onclick={onFollow} class="text-sm font-semibold text-guild-on-surface">
		{m.activity_organiser_follow()}
	</button>
</div>
