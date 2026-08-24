<script lang="ts">
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { formatShortDateTime } from '$lib/format/datetime';
	import { m } from '$lib/paraglide/messages.js';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { Bell } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	useAppBars(() => ({
		topBar: detailTopBar({ title: m.notifications_title() }),
		bottom: emptyBottom
	}));
</script>

<section class="px-4 pb-8">
	{#if data.notifications.length === 0}
		<EmptyState icon={Bell} title={m.notifications_empty()} />
	{:else}
		<ul class="space-y-3">
			{#each data.notifications as notification (notification.id)}
				<li
					class="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
					<time class="block text-xs font-medium text-guild-on-surface/55">
						{formatShortDateTime(notification.sentAt)}
					</time>
					<h2 class="mt-1.5 text-[17px] font-semibold text-guild-on-surface">
						{notification.title}
					</h2>
					{#if notification.content}
						<p class="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-guild-on-surface/75">
							{notification.content}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>
