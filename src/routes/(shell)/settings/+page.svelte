<script lang="ts">
	import { Bell, ChevronRight, Download, Globe, Info, ScanLine } from '@lucide/svelte';
	import { locales } from '$lib/paraglide/runtime';
	import { locale, setLocale } from '$lib/state/locale.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { pushNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';

	type Locale = (typeof locales)[number];

	// Native names — these don't get translated; each locale shows its own name.
	const nativeName: Record<Locale, string> = {
		en: 'English',
		sv: 'Svenska'
	};

	import { setLanguage } from '$lib/api/user';
	import { onMount } from 'svelte';
	import { listValidationActivities } from '$lib/api/validation';
	import type { Ticket } from '$lib/api/tickets';
	import { errorMessage } from '$lib/api/errors';
	import { downloadReceipt as downloadTicketReceipt } from '$lib/receipt';
	import { formatCardDate } from '$lib/format/datetime';
	import type { PageProps } from './$types';
	import { network } from '$lib/state/network.svelte';
	import { clearCache } from '$lib/api/cache';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();
	const networkUnavailable = $derived(!network.online || data.networkUnavailable);

	let canVerify = $state(false);
	let languageBusy = $state(false);
	onMount(() => {
		void listValidationActivities()
			.then((items) => (canVerify = items.length > 0))
			.catch(() => {});
	});

	async function toggleLocale() {
		const next: Locale = locale.current === 'en' ? 'sv' : 'en';
		languageBusy = true;
		try {
			await setLanguage(next);
			clearCache();
			await setLocale(next, { reload: false });
			await invalidateAll();
		} finally {
			languageBusy = false;
		}
	}

	async function downloadReceipt(ticket: Ticket) {
		try {
			await downloadTicketReceipt(ticket.id);
		} catch (cause) {
			alert(errorMessage(cause) ?? m.error_status_unknown());
		}
	}
</script>

<div class="flex w-full flex-col gap-3.75 px-4">
	<button
		type="button"
		onclick={toggleLocale}
		disabled={languageBusy || networkUnavailable}
		class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface">
			<Globe class="size-5" aria-hidden="true" />
		</div>
		<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
			{m.settings_language()}
		</span>
		<span class="text-[16px] font-semibold text-guild-on-surface">
			{nativeName[locale.current]}
		</span>
	</button>
	<button
		type="button"
		disabled={networkUnavailable}
		onclick={() => pushNavigation(Routes.NotificationSettings)}
		class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)] disabled:opacity-55">
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface">
			<Bell class="size-5" aria-hidden="true" />
		</div>
		<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
			{m.notification_settings_title()}
		</span>
		<ChevronRight class="size-5 text-guild-on-surface/50" aria-hidden="true" />
	</button>
	{#if canVerify}
		<button
			type="button"
			onclick={() => pushNavigation(Routes.Verify)}
			class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm">
			<div class="flex size-10 items-center justify-center rounded-full bg-guild-primary-light">
				<ScanLine class="size-5" />
			</div>
			<span class="flex-1 text-[16px] font-medium">{m.verifier_title()}</span><ChevronRight
				class="size-5 opacity-50" />
		</button>
	{/if}
	<button
		type="button"
		onclick={() => pushNavigation(Routes.About)}
		class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface">
			<Info class="size-5" aria-hidden="true" />
		</div>
		<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
			{m.settings_about()}
		</span>
		<ChevronRight class="size-5 text-guild-on-surface/50" aria-hidden="true" />
	</button>

	{#if data.tickets.length > 0 || networkUnavailable}
		<section class="mt-2">
			<h2 class="mb-2 px-1 text-lg font-semibold">{m.settings_purchased_tickets()}</h2>
			{#if networkUnavailable && data.tickets.length === 0}
				<p class="rounded-2xl bg-white p-4 text-sm text-guild-on-surface/70">
					{m.offline_feature_unavailable()}
				</p>
			{:else}
				<div
					class="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
					{#each data.tickets as ticket (ticket.id)}
						<div class="flex items-center justify-between gap-4 p-4">
							<div class="min-w-0">
								<p class="truncate font-semibold text-guild-on-surface">{ticket.activityTitle}</p>
								<p class="mt-0.5 truncate text-sm text-gray-600">
									{formatCardDate(ticket.timeStart)} · {ticket.ticketKindName}
								</p>
							</div>
							<button
								type="button"
								disabled={networkUnavailable}
								onclick={() => downloadReceipt(ticket)}
								class="flex shrink-0 items-center gap-1.5 rounded-full border border-guild-ring px-3 py-2 text-sm font-semibold text-guild-on-surface hover:bg-guild-surface disabled:opacity-45">
								<Download class="size-4" aria-hidden="true" />
								{m.home_download_receipt()}
							</button>
						</div>
					{/each}
				</div>
				{#if networkUnavailable}
					<p class="mt-2 px-1 text-xs text-amber-800">{m.offline_receipts_unavailable()}</p>
				{/if}
			{/if}
		</section>
	{/if}
</div>
