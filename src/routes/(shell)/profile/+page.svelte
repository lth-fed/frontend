<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { guilds } from '$lib/data/guilds';
	import { logout } from '$lib/auth/logout';
	import { session } from '$lib/state/session.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import { requestGroupMembership } from '$lib/api/groups';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { ChevronRight } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { network } from '$lib/state/network.svelte';

	let { data }: PageProps = $props();
	const me = $derived(data.me);
	const joinableGroups = $derived(
		data.joinableGroups.filter((jG) => me.groups.findIndex((meG) => meG.id === jG.id) === -1)
	);
	const requested = new SvelteSet<string>();
	const busy = new SvelteSet<string>();
	const networkUnavailable = $derived(!network.online || data.networkUnavailable);
	let joinError = $state('');

	async function handleSignOut() {
		await logout();
	}

	async function requestJoin(groupId: string) {
		busy.add(groupId);
		joinError = '';
		try {
			await requestGroupMembership(groupId);
			requested.add(groupId);
		} catch (error) {
			joinError = error instanceof Error ? error.message : m.error_status_unknown();
		} finally {
			busy.delete(groupId);
		}
	}
</script>

<div class="flex w-full flex-col gap-3.75 px-4">
	<div
		class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
		<Avatar userId={me.id} size="lg" />
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<h2 class="text-[20px] leading-tight font-semibold text-guild-on-surface">
				{me.name}
			</h2>
			<p class="text-sm text-gray-600">
				<span class="font-medium">{m.profile_student_id_label()}:</span>
				{me.id}
			</p>
			{#if session.guild}
				<p class="text-sm text-gray-600">
					<span class="font-medium">{m.profile_guild_label()}:</span>
					{guilds[session.guild].name}
				</p>
			{/if}
		</div>
	</div>

	{#if me.groups.length}
		<section class="mt-2">
			<h2 class="mb-2 px-1 text-lg font-semibold">{m.profile_my_groups()}</h2>
			<div class="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
				{#each me.groups as group (group.id)}
					<button
						type="button"
						disabled={networkUnavailable}
						onclick={() => pushNavigation(Routes.Group(group.id))}
						class="flex w-full items-center gap-3 border-b border-gray-100 p-4 text-left last:border-0 disabled:opacity-55">
						<img src={group.logoUrl} alt="" class="size-9 object-contain" />
						<span class="min-w-0 flex-1"
							><strong class="block truncate">{group.name}</strong><small
								class="line-clamp-1 text-gray-500">{group.description}</small
							></span>
						<ChevronRight class="size-5 text-gray-400" />
					</button>
				{/each}
			</div>
			{#if networkUnavailable}
				<p class="mt-2 px-1 text-xs text-amber-800">{m.offline_group_details_unavailable()}</p>
			{/if}
		</section>
	{/if}

	{#if joinableGroups.length}
		<section class="mt-2">
			<h2 class="mb-2 px-1 text-lg font-semibold">{m.profile_joinable_groups()}</h2>
			<div class="space-y-2">
				{#each joinableGroups as group (group.id)}
					<div
						class="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
						<img src={group.logoUrl} alt="" class="size-9 object-contain" />
						<span class="min-w-0 flex-1"
							><strong class="block truncate">{group.name}</strong><small
								class="line-clamp-1 text-gray-500">{group.description}</small
							></span>
						<button
							type="button"
							disabled={networkUnavailable ||
								group.requested ||
								requested.has(group.id) ||
								busy.has(group.id)}
							onclick={() => requestJoin(group.id)}
							class="rounded-full bg-guild-primary px-4 py-2 text-sm font-semibold text-guild-on-primary disabled:opacity-50">
							{group.requested || requested.has(group.id) ? m.group_requested() : m.group_join()}
						</button>
					</div>
				{/each}
			</div>
			{#if joinError}<p class="mt-2 text-sm text-red-700" role="alert">{joinError}</p>{/if}
			{#if networkUnavailable}
				<p class="mt-2 px-1 text-xs text-amber-800">{m.offline_feature_unavailable()}</p>
			{/if}
		</section>
	{/if}
	{#if networkUnavailable && !joinableGroups.length}
		<section class="mt-2">
			<h2 class="mb-2 px-1 text-lg font-semibold">{m.profile_joinable_groups()}</h2>
			<p class="rounded-2xl bg-white p-4 text-sm text-guild-on-surface/70">
				{m.offline_feature_unavailable()}
			</p>
		</section>
	{/if}

	<button
		type="button"
		onclick={handleSignOut}
		class="mt-3 w-full rounded-3xl border border-gray-100 bg-white p-4 text-center text-[16px] font-semibold text-red-600 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
		{m.profile_sign_out()}
	</button>
</div>
