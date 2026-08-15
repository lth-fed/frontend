<script lang="ts">
	import type { PageProps } from './$types';
	import GroupTree from '$lib/components/GroupTree.svelte';
	import { setGroupSetting, type Group, type GroupSetting } from '$lib/api/groups';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { errorMessage } from '$lib/api/errors';

	let { data }: PageProps = $props();
	const settings = new SvelteMap<string, GroupSetting>();
	const busyIds = new SvelteSet<string>();
	let error = $state('');

	function inherited(group: Group): GroupSetting | undefined {
		const explicit =
			settings.get(group.id) ?? data.settings.find((setting) => setting.groupId === group.id);
		if (explicit) return explicit;
		const ancestors = data.groups
			.filter(
				(candidate) =>
					group.path.startsWith(`${candidate.path}.`) &&
					(settings.has(candidate.id) ||
						data.settings.some((setting) => setting.groupId === candidate.id))
			)
			.sort((a, b) => b.path.length - a.path.length);
		return ancestors[0]
			? (settings.get(ancestors[0].id) ??
					data.settings.find((setting) => setting.groupId === ancestors[0].id))
			: undefined;
	}

	async function save(
		group: Group,
		update: Partial<Pick<GroupSetting, 'visible' | 'notificationLevel'>>
	) {
		const previous =
			settings.get(group.id) ?? data.settings.find((setting) => setting.groupId === group.id);
		const effective = inherited(group);
		const setting: GroupSetting = {
			groupId: group.id,
			visible: update.visible ?? effective?.visible ?? true,
			notificationLevel: update.notificationLevel ?? effective?.notificationLevel ?? 'personalized'
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
		void save(group, { visible });
	}

	function changeNotifications(group: Group, notificationLevel: GroupSetting['notificationLevel']) {
		void save(group, { notificationLevel });
	}

	useAppBars(() => ({ topBar: detailTopBar({ title: m.filters_title() }), bottom: emptyBottom }));
</script>

<div class="flex flex-col gap-4 px-4">
	<header>
		<h2 class="text-2xl font-semibold">{m.filters_title()}</h2>
		<p class="mt-1 text-sm text-guild-on-surface/65">{m.filters_description()}</p>
	</header>
	{#if error}<p class="text-sm text-red-700" role="alert">{error}</p>{/if}
	<GroupTree
		groups={data.groups}
		visible={(group) => inherited(group)?.visible ?? true}
		notificationLevel={(group) => inherited(group)?.notificationLevel ?? 'personalized'}
		busy={(group) => busyIds.has(group.id)}
		onchange={change}
		onnotificationchange={changeNotifications} />
</div>
