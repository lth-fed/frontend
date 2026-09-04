<script lang="ts">
	import type { PageProps } from './$types';
	import GroupTree from '$lib/components/GroupTree.svelte';
	import {
		inheritedGroupSetting,
		setGroupSetting,
		type Group,
		type GroupSetting
	} from '$lib/api/groups';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { untrack } from 'svelte';
	import { errorMessage } from '$lib/api/errors';

	let { data }: PageProps = $props();
	const settings = new SvelteMap<string, GroupSetting>(
		untrack(() => data.settings.map((setting) => [setting.groupId, setting]))
	);
	const busyIds = new SvelteSet<string>();
	let error = $state('');
	let notice = $state('');

	function inherited(group: Group): GroupSetting | undefined {
		return inheritedGroupSetting(group, data.groups, settings.values());
	}

	async function save(
		group: Group,
		update: Partial<Pick<GroupSetting, 'visible' | 'notificationLevel'>>
	) {
		const previous = settings.get(group.id);
		const effective = inherited(group);
		const setting: GroupSetting = {
			groupId: group.id,
			visible: update.visible ?? effective?.visible ?? false,
			notificationLevel: update.notificationLevel ?? effective?.notificationLevel ?? 'none'
		};
		settings.set(group.id, setting);
		busyIds.add(group.id);
		error = '';
		try {
			await setGroupSetting(setting);
		} catch (cause) {
			if (previous) settings.set(group.id, previous);
			else settings.delete(group.id);
			error = errorMessage(cause) ?? m.error_status_unknown();
		} finally {
			busyIds.delete(group.id);
		}
	}

	function change(group: Group, visible: boolean) {
		const notificationLevel = inherited(group)?.notificationLevel ?? 'none';
		if (!visible && notificationLevel !== 'none') {
			notice = m.filters_notifications_disabled({ group: group.name });
			void save(group, { visible, notificationLevel: 'none' });
			return;
		}
		notice = '';
		void save(group, { visible });
	}

	useAppBars(() => ({ topBar: detailTopBar({ title: m.filters_title() }), bottom: emptyBottom }));
</script>

<div class="flex flex-col gap-4 px-4">
	<header>
		<h2 class="text-2xl font-semibold">{m.filters_title()}</h2>
		<p class="mt-1 text-sm text-guild-on-surface/65">{m.filters_description()}</p>
	</header>
	{#if error}<p class="text-sm text-red-700" role="alert">{error}</p>{/if}
	{#if notice}<p class="text-sm text-guild-on-surface/70" role="status">{notice}</p>{/if}
	<GroupTree
		groups={data.groups}
		visible={(group) => inherited(group)?.visible ?? false}
		notificationLevel={(group) => inherited(group)?.notificationLevel ?? 'none'}
		busy={(group) => busyIds.has(group.id)}
		showNotifications={false}
		onchange={change}
		initiallyExpandedDepth={2} />
</div>
