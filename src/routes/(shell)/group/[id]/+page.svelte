<script lang="ts">
	import type { PageProps } from './$types';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';
	import {
		backNavigation,
		pushNavigation,
		replaceNavigation
	} from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { ChevronRight } from '@lucide/svelte';
	let { data }: PageProps = $props();

	function goBack() {
		if (backNavigation()) return;
		const returnTo = page.state.returnTo as Pathname | undefined;
		void replaceNavigation(returnTo ?? Routes.Home, { resetDepth: returnTo === undefined });
	}

	useAppBars(() => ({
		topBar: detailTopBar({ title: data.group.name, onBack: goBack }),
		bottom: emptyBottom
	}));
</script>

<div class="px-4">
	<article class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
		<img src={data.group.logoUrl} alt="" class="size-20 object-contain" />
		<h1 class="mt-4 text-2xl font-semibold text-guild-on-surface">{data.group.name}</h1>
		<p class="mt-1 text-sm text-guild-on-surface/55">{data.group.path}</p>
		<p class="mt-5 whitespace-pre-line text-guild-on-surface/80">{data.group.description}</p>
		{#if data.subgroups.length > 0}
			<section class="mt-6">
				<h2 class="text-lg font-semibold text-guild-on-surface">{m.group_subgroups()}</h2>
				<div class="mt-2 divide-y divide-gray-200 overflow-hidden rounded-2xl bg-gray-50">
					{#each data.subgroups as subgroup (subgroup.id)}
						<button
							type="button"
							onclick={() => pushNavigation(Routes.Group(subgroup.id))}
							class="flex w-full items-center gap-3 p-3 text-left">
							<img src={subgroup.logoUrl} alt="" class="size-10 shrink-0 object-contain" />
							<span class="min-w-0 flex-1">
								<strong class="block truncate text-guild-on-surface">{subgroup.name}</strong>
								<small class="block truncate text-guild-on-surface/55">{subgroup.path}</small>
							</span>
							<ChevronRight class="size-5 shrink-0 text-guild-on-surface/45" aria-hidden="true" />
						</button>
					{/each}
				</div>
			</section>
		{/if}
		{#if data.group.limitMembershipVisibility}
			<p class="mt-5 rounded-2xl bg-gray-100 p-3 text-sm">{m.group_members_private()}</p>
		{/if}
	</article>
</div>
