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
	import { leaveGroup, setGroupSetting, type GroupSetting } from '$lib/api/groups';
	import { errorMessage } from '$lib/api/errors';
	import { untrack } from 'svelte';
	let { data }: PageProps = $props();
	let setting = $state<GroupSetting>(untrack(() => ({ ...data.setting, groupId: data.group.id })));
	let settingBusy = $state(false);
	let leaving = $state(false);
	let leftGroupId = $state<string>();
	let isDirectMember = $derived(data.isDirectMember && leftGroupId !== data.group.id);
	let actionError = $state('');
	let adminEmails = $derived(
		data.group.adminIds
			.filter((adminId) => adminId.startsWith('email:'))
			.map((adminId) => adminId.slice('email:'.length))
			.filter(Boolean)
	);

	async function saveSetting(update: Partial<Pick<GroupSetting, 'visible' | 'notificationLevel'>>) {
		const previous = setting;
		setting = { ...setting, ...update, groupId: data.group.id };
		settingBusy = true;
		actionError = '';
		try {
			await setGroupSetting(setting);
		} catch (cause) {
			setting = previous;
			actionError = errorMessage(cause) ?? m.error_status_unknown();
		} finally {
			settingBusy = false;
		}
	}

	async function confirmLeave() {
		if (!confirm(m.group_leave_confirm({ group: data.group.name }))) return;
		leaving = true;
		actionError = '';
		try {
			await leaveGroup(data.group.id);
			leftGroupId = data.group.id;
		} catch (cause) {
			actionError = errorMessage(cause) ?? m.group_leave_failed();
		} finally {
			leaving = false;
		}
	}

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
		<section class="mt-6">
			<h2 class="text-lg font-semibold text-guild-on-surface">{m.group_admins()}</h2>
			{#if adminEmails.length > 0}
				<ul class="mt-2 divide-y divide-gray-200 overflow-hidden rounded-2xl bg-gray-50">
					{#each adminEmails as email (email)}
						<li class="px-4 py-3 text-sm text-guild-on-surface">
							<a class="underline underline-offset-2" href={`mailto:${email}`}>{email}</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-2 text-sm text-guild-on-surface/60">{m.group_no_admins()}</p>
			{/if}
		</section>
		<section class="mt-6">
			<h2 class="text-lg font-semibold text-guild-on-surface">{m.group_settings()}</h2>
			<div class="mt-2 space-y-3 rounded-2xl bg-gray-50 p-4">
				<label class="flex items-center justify-between gap-4 text-sm font-medium">
					<span>{m.group_visible()}</span>
					<input
						type="checkbox"
						checked={setting.visible}
						disabled={settingBusy}
						onchange={(event) => void saveSetting({ visible: event.currentTarget.checked })} />
				</label>
				<label class="block text-sm font-medium">
					<span>{m.filters_notifications_label({ group: data.group.name })}</span>
					<select
						value={setting.notificationLevel}
						disabled={settingBusy}
						onchange={(event) =>
							void saveSetting({
								notificationLevel: event.currentTarget.value as GroupSetting['notificationLevel']
							})}
						class="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
						<option value="none">{m.filters_notifications_none()}</option>
						<option value="all">{m.filters_notifications_all()}</option>
					</select>
				</label>
			</div>
		</section>
		{#if data.group.limitMembershipVisibility}
			<p class="mt-5 rounded-2xl bg-gray-100 p-3 text-sm">{m.group_members_private()}</p>
		{/if}
		{#if actionError}<p class="mt-4 text-sm text-red-700" role="alert">{actionError}</p>{/if}
		{#if isDirectMember}
			<button
				type="button"
				disabled={leaving}
				onclick={confirmLeave}
				class="mt-6 w-full rounded-2xl border border-red-200 px-4 py-3 font-semibold text-red-700 disabled:opacity-50">
				{m.group_leave()}
			</button>
		{/if}
	</article>
</div>
