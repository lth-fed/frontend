<script lang="ts">
	import type { ActivityOrganiser } from '$lib/api/activities';
	import { m } from '$lib/paraglide/messages.js';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { seed } from '$lib/api/cache';

	function openDetails() {
		// Minilith currently has no public GET /groups/:id. Seed the detail
		// route with the organiser data already returned by the activity;
		// group-tree data will enrich member groups when available.
		seed(`group:${organiser.id}`, {
			id: organiser.id,
			path: organiser.path,
			name: organiser.name,
			description: '',
			limitMembershipVisibility: false,
			deleted: false,
			logoUrl: organiser.logoUrl
		});
		void pushNavigation(Routes.Group(organiser.id));
	}

	interface Props {
		organiser: ActivityOrganiser;
		onFollow?: () => void;
	}

	let { organiser, onFollow }: Props = $props();
</script>

<div
	data-guild={organiser.guild}
	class="flex w-full items-center gap-3 rounded-3xl border border-gray-100 bg-guild-primary-light p-4 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
	<button
		type="button"
		onclick={openDetails}
		class="flex min-w-0 flex-1 items-center gap-3 text-left">
		<img src={organiser.logoUrl} alt="" class="size-10 shrink-0 object-contain" />
		<span class="truncate text-[16px] font-medium text-guild-on-surface">{organiser.name}</span>
	</button>
	<!-- <button type="button" onclick={onFollow} class="text-sm font-semibold text-guild-on-surface"> -->
	<!-- 	{m.activity_organiser_follow()} -->
	<!-- </button> -->
</div>
