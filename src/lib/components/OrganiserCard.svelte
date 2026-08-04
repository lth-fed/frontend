<script lang="ts">
	import type { ActivityOrganiser } from '$lib/api/activities';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		organiser: ActivityOrganiser;
		onFollow?: () => void;
	}

	let { organiser, onFollow }: Props = $props();
</script>

<div
	data-guild={organiser.guild}
	class="flex w-full items-center gap-3 rounded-3xl border border-gray-100 bg-guild-primary-light p-4 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
	<img src={organiser.logoUrl} alt="" class="size-10 shrink-0 object-contain" />
	<span class="w-full text-[16px] font-medium text-guild-on-surface">{organiser.name}</span>
	<button type="button" onclick={onFollow} class="text-sm font-semibold text-guild-on-surface">
		{m.activity_organiser_follow()}
	</button>
</div>
