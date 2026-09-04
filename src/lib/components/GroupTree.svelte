<script lang="ts">
	import { ChevronDown, ChevronRight } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Group, NotificationLevel } from '$lib/api/groups';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		groups: Group[];
		visible: (group: Group) => boolean;
		notificationLevel: (group: Group) => NotificationLevel;
		busy?: (group: Group) => boolean;
		showVisibility?: boolean;
		showNotifications?: boolean;
		initiallyExpandedDepth?: number;
		onchange?: (group: Group, visible: boolean) => void;
		onnotificationchange?: (group: Group, level: NotificationLevel) => void;
	}

	let {
		groups,
		visible,
		notificationLevel,
		busy = () => false,
		showVisibility = true,
		showNotifications = true,
		initiallyExpandedDepth = 2,
		onchange = () => {},
		onnotificationchange = () => {}
	}: Props = $props();
	const expanded = new SvelteSet<string>(
		untrack(() =>
			groups
				.filter((group) => group.path.split('.').length < initiallyExpandedDepth)
				.map((group) => group.id)
		)
	);

	const rows = $derived.by(() => {
		const sorted = [...groups]
			.filter((group) => !group.deleted)
			.sort((a, b) => a.path.localeCompare(b.path));
		const paths = new Set(sorted.map((group) => group.path));
		const parentPaths = new Set(
			sorted.map((group) => group.path.slice(0, group.path.lastIndexOf('.'))).filter(Boolean)
		);
		return sorted
			.filter((group) => {
				const parts = group.path.split('.');
				for (let i = 1; i < parts.length; i += 1) {
					const parentPath = parts.slice(0, i).join('.');
					const parent = sorted.find((candidate) => candidate.path === parentPath);
					if (parent && !expanded.has(parent.id)) return false;
				}
				return true;
			})
			.map((group) => ({
				group,
				depth: group.path
					.split('.')
					.slice(0, -1)
					.filter((_, index, parts) => paths.has(parts.slice(0, index + 1).join('.'))).length,
				hasChildren: parentPaths.has(group.path)
			}));
	});
</script>

<div class="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
	{#each rows as row (row.group.id)}
		<div
			class="flex min-h-14 items-center gap-2 border-b border-gray-100 pr-4 last:border-0"
			style:padding-left={`${row.depth * 18 + 10}px`}>
			{#if row.hasChildren}
				<button
					type="button"
					aria-label={row.group.name}
					aria-expanded={expanded.has(row.group.id)}
					onclick={() =>
						expanded.has(row.group.id) ? expanded.delete(row.group.id) : expanded.add(row.group.id)}
					class="grid size-8 shrink-0 place-items-center rounded-full">
					{#if expanded.has(row.group.id)}<ChevronDown class="size-4" />{:else}<ChevronRight
							class="size-4" />{/if}
				</button>
			{:else}
				<span class="size-8 shrink-0"></span>
			{/if}
			<img src={row.group.logoUrl} alt="" class="size-8 shrink-0 object-contain" />
			<span class="min-w-0 flex-1">
				<strong class="block truncate text-sm text-guild-on-surface">{row.group.name}</strong>
				<small class="block truncate text-guild-on-surface/55">{row.group.path}</small>
			</span>
			{#if showVisibility}
				<input
					type="checkbox"
					aria-label={m.filters_visibility_label({ group: row.group.name })}
					checked={visible(row.group)}
					disabled={busy(row.group)}
					onchange={(event) => onchange(row.group, event.currentTarget.checked)} />
			{/if}
			{#if showNotifications}
				<select
					aria-label={m.filters_notifications_label({ group: row.group.name })}
					value={notificationLevel(row.group)}
					disabled={busy(row.group)}
					onchange={(event) =>
						onnotificationchange(row.group, event.currentTarget.value as NotificationLevel)}
					class="max-w-28 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs text-guild-on-surface">
					<option value="none">{m.filters_notifications_none()}</option>
					<option value="personalized">{m.filters_notifications_personalized()}</option>
					<option value="all">{m.filters_notifications_all()}</option>
				</select>
			{/if}
		</div>
	{/each}
</div>
