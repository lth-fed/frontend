<script lang="ts">
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { formatShortDateTime } from '$lib/format/datetime';
	import { m } from '$lib/paraglide/messages.js';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { Bell } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import LinkedText from '$lib/components/LinkedText.svelte';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';

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
					class="relative rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
					{#if notification.activityId}
						<button
							type="button"
							class="absolute inset-0 rounded-3xl"
							aria-label={m.notification_open_activity()}
							onclick={() => void pushNavigation(Routes.Activity(notification.activityId!))}
						></button>
					{/if}
					<div class="pointer-events-none relative">
						<time class="block text-xs font-medium text-guild-on-surface/55">
							{formatShortDateTime(notification.sentAt)}
						</time>
						<h2 class="mt-1.5 text-[17px] font-semibold text-guild-on-surface">
							{notification.sender? `${notification.sender}: ` : ""}{notification.title}
						</h2>
						{#if notification.content}
							<p
								class="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-guild-on-surface/75">
								<LinkedText text={notification.content} />
							</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
