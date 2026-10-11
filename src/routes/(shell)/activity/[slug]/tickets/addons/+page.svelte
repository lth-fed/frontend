<script lang="ts">
	import { page } from '$app/state';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import type { TicketKind } from '$lib/api';
	import { serverNow } from '$lib/api/serverClock';
	import {
		acknowledge,
		beginPaymentReturnPolling,
		cancel,
		choosePaymentAgain,
		configurePurchase,
		pay,
		purchase,
		resync,
		setAttached
	} from '$lib/purchase/purchase.svelte';
	import { requestPurchaseCelebration } from '$lib/purchase/celebration';
	import { freeGateway, paidGatewayFor } from '$lib/payment/gateway';
	import { formatPrice } from '$lib/format/money';
	import {
		backNavigation,
		pushNavigation,
		replaceNavigation
	} from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { AvailableAddon } from '$lib/api/activities';
	import { errorMessage } from '$lib/api/errors';

	let { data }: PageProps = $props();
	const activity = $derived(data.activity);
	const flow = $derived(purchase.flow);
	const flowKindId = $derived(
		'kind' in flow && flow.kind.activityId === activity.id ? flow.kind.ticketKindId : undefined
	);

	// Gating states are time-derived; tick so cards flip live when a
	// release window opens or sales close while the page is visible.
	let now = $state(serverNow());
	let pageVisible = $state(false);
	onMount(() => {
		const tick = setInterval(() => (now = serverNow()), 1_000);
		const updateVisibility = () => (pageVisible = !document.hidden);
		updateVisibility();
		document.addEventListener('visibilitychange', updateVisibility);
		setAttached(true);
		return () => {
			clearInterval(tick);
			document.removeEventListener('visibilitychange', updateVisibility);
			setAttached(false);
		};
	});

	// Landing a purchase (free or via reservation) sends the user home
	// to the ticket carousel.
	$effect(() => {
		if (flow.state === 'purchased' && flow.kind.activityId === activity.id) {
			requestPurchaseCelebration();
			acknowledge();
			void replaceNavigation(Routes.Home, { resetDepth: true });
		}
	});

	let configuringKind = $state<TicketKind | undefined>();
	const selectedOptions = new SvelteMap<string, number[]>();
	const selectedTexts = new SvelteMap<string, string>();
	let addonError = $state('');

	function openAddonConfiguration(kind: TicketKind) {
		selectedOptions.clear();
		selectedTexts.clear();
		if (flow.state === 'reserved') {
			for (const selection of flow.kind.addons ?? []) {
				selectedOptions.set(selection.id, selection.selectedOptions ?? []);
				selectedTexts.set(selection.id, selection.selectedText ?? '');
			}
		}
		configuringKind = kind;
		addonError = '';
	}

	function toggleOption(addon: AvailableAddon, index: number, checked: boolean) {
		const current = selectedOptions.get(addon.id) ?? [];
		if (!addon.multipleAlternatives && checked) selectedTexts.set(addon.id, '');
		selectedOptions.set(
			addon.id,
			addon.multipleAlternatives
				? checked
					? [...new Set([...current, index])]
					: current.filter((value) => value !== index)
				: checked
					? [index]
					: []
		);
	}

	function updateText(addon: AvailableAddon, value: string) {
		selectedTexts.set(addon.id, value);
		if (!addon.multipleAlternatives && value.trim() !== '') {
			selectedOptions.set(addon.id, []);
		}
	}

	function configuredAddons(kind: TicketKind) {
		return kind.addons.map((addon) => ({
			id: addon.id,
			selectedOptions: selectedOptions.get(addon.id) ?? [],
			selectedText:
				selectedTexts.get(addon.id)?.trim() === '' ? undefined : selectedTexts.get(addon.id)
		}));
	}

	function confirmAddons() {
		const kind = configuringKind;
		if (!kind || flow.state !== 'reserved' || flow.kind.ticketKindId !== kind.id) return;
		if (serverNow() >= flow.latestTransaction) {
			addonError = m.queue_pay_too_late();
			return;
		}
		for (const addon of kind.addons) {
			const options = selectedOptions.get(addon.id) ?? [];
			const text = (selectedTexts.get(addon.id) ?? '').trim();
			if (addon.required && options.length === 0 && (!addon.hasTextField || !text)) {
				addonError = m.addon_required({ name: addon.name });
				return;
			}
		}
		configuringKind = undefined;
		const addons = configuredAddons(kind);
		const totalPrice = addons.reduce((total, selection) => {
			const addon = kind.addons.find((candidate) => candidate.id === selection.id);
			return (
				total +
				(selection.selectedOptions ?? []).reduce(
					(sum, index) =>
						sum + (addon?.options.find((option) => option.index === index)?.price ?? 0),
					0
				)
			);
		}, kind.price);
		configurePurchase(addons, totalPrice !== 0);
		if (totalPrice === 0) void tryFreePayment();
	}

	function mmss(until: Date): string {
		const total = Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000));
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	// Payment confirmation (krav §6 "test view"): the complete frontend
	// selection determines whether a paid provider is needed.
	let payError = $state<string | undefined>(undefined);
	let promptedAddonKindId = $state<string | undefined>(undefined);
	let cancelling = $state(false);
	let cancelError = $state<string | undefined>(undefined);
	let showPayAgain = $state(false);

	$effect(() => {
		showPayAgain = false;
		if (flow.state !== 'paying' || !pageVisible) return;
		beginPaymentReturnPolling();
		const timer = window.setTimeout(() => (showPayAgain = true), 5_000);
		return () => window.clearTimeout(timer);
	});

	async function handleCancel() {
		if (cancelling) return;
		cancelling = true;
		cancelError = undefined;
		try {
			await cancel();
			await returnToTicketKinds();
		} catch (cause) {
			cancelError = errorMessage(cause) ?? m.queue_cancel_failed();
		} finally {
			cancelling = false;
		}
	}

	async function tryFreePayment() {
		payError = undefined;
		if (flow.state !== 'reserved' || !flowKindId) return;
		const { error } = await pay(freeGateway);
		if (error) payError = error;
	}

	function changeAddons() {
		if (flow.state !== 'reserved' || !flowKindId) return;
		const kind = data.ticketKinds.find((candidate) => candidate.id === flow.kind.ticketKindId);
		if (!kind) return;
		openAddonConfiguration(kind);
	}

	async function confirmPay(provider: 'swish' | 'stripe') {
		payError = undefined;
		if (flow.state !== 'reserved' || !flowKindId) return;
		const { error } = await pay(paidGatewayFor(provider));
		if (error) payError = error;
	}

	$effect(() => {
		if (flow.state !== 'reserved' || !flowKindId) return;
		const kind = data.ticketKinds.find((candidate) => candidate.id === flowKindId);
		if (kind && promptedAddonKindId !== kind.id) {
			promptedAddonKindId = kind.id;
			openAddonConfiguration(kind);
		}
	});

	async function returnToTicketKinds() {
		if (page.state.returnTo === Routes.ActivityTickets(activity.id) && backNavigation()) return;
		// Direct checkout links need the same Activity → Tickets history as normal entry.
		await replaceNavigation(Routes.Activity(activity.id));
		await pushNavigation(Routes.ActivityTickets(activity.id));
	}

	useAppBars(() => ({
		topBar: detailTopBar({
			title: m.addons_title(),
			onBack: () => void returnToTicketKinds()
		}),
		bottom: emptyBottom
	}));
</script>

<div data-guild={activity.creatorGuild} class="flex w-full flex-col gap-3.75 px-4">
	<h2 class="text-[24px] font-semibold">{activity.title}</h2>

	{#if flow.state !== 'idle' && 'kind' in flow && flow.kind.activityId === activity.id}
		<!-- Active flow panel for a kind on THIS activity (spec §4.5) -->
		<div
			class="flex w-full flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
			role="status">
			<span class="text-[16px] font-semibold text-guild-on-surface">{flow.kind.name}</span>

			{#if flow.state === 'release-queued'}
				<p class="text-sm text-guild-on-surface/80">
					{m.queue_release_countdown({ time: mmss(flow.releaseAt) })}
				</p>
				<p class="text-xs text-guild-on-surface/60">{m.queue_lottery_note()}</p>
			{:else if flow.state === 'resolving'}
				<p class="text-sm text-guild-on-surface/80">{m.queue_resolving()}</p>
			{:else if flow.state === 'reservation-queued'}
				<p class="text-sm text-guild-on-surface/80">
					{m.queue_placement({ placement: flow.placement })}
				</p>
			{:else if flow.state === 'reserved'}
				{#if !configuringKind && now < flow.latestTransaction}
					<h3 class="text-lg font-semibold text-guild-on-surface">{m.pay_confirm_title()}</h3>
					{#if flow.paymentRequired}
						<p class="text-sm text-guild-on-surface/80">{m.pay_confirm_body()}</p>
						{#if getLocale() === 'en'}
							<p class="rounded-2xl bg-guild-primary-light p-3 text-sm text-guild-on-surface/80">
								{m.pay_card_discouraged()}
							</p>
						{/if}
						<button
							type="button"
							onclick={() => confirmPay('swish')}
							class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary"
							>{m.pay_with_swish()}</button>
						{#if getLocale() === 'en'}
							<button
								type="button"
								onclick={() => confirmPay('stripe')}
								class="w-full rounded-full border border-guild-ring px-5 py-3.5 text-base font-semibold text-guild-on-surface"
								>{m.pay_with_stripe()}</button>
						{/if}
					{:else}
						<button
							type="button"
							onclick={tryFreePayment}
							class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary"
							>{m.pay_confirm_title()}</button>
					{/if}
					<button
						type="button"
						onclick={changeAddons}
						class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface"
						>{m.change_addons()}</button>
				{:else if now >= flow.latestTransaction}
					<!-- inside the last minute: too late to safely start (spec §4.2) -->
					<p class="text-sm text-red-700">{m.queue_pay_too_late()}</p>
				{/if}
				{#if payError}
					<p class="text-sm text-red-700" role="alert">{payError}</p>
				{/if}
			{:else if flow.state === 'paying'}
				<p class="text-sm text-guild-on-surface/80">{m.pill_paying()}</p>
				{#if showPayAgain}<button
						type="button"
						onclick={choosePaymentAgain}
						class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
						{m.payment_choose_again()}
					</button>{/if}
			{:else if flow.state === 'delayed'}
				<p class="text-sm text-guild-on-surface/80">{m.queue_delayed()}</p>
				<button
					type="button"
					onclick={() => resync()}
					class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
					{m.error_try_again()}
				</button>
			{:else if flow.state === 'expired'}
				<p class="text-sm text-red-700">{m.queue_expired()}</p>
			{:else if flow.state === 'failed'}
				<p class="text-sm text-red-700">{flow.message ?? m.queue_failed()}</p>
			{/if}

			{#if cancelError}
				<p class="text-sm text-red-700" role="alert">{cancelError}</p>
			{/if}

			{#if flow.state === 'expired' || flow.state === 'failed'}
				<button
					type="button"
					onclick={handleCancel}
					disabled={cancelling}
					class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
					{cancelling ? m.queue_cancelling() : m.queue_leave()}
				</button>
			{:else if flow.state !== 'paying'}
				<button
					type="button"
					onclick={handleCancel}
					disabled={cancelling}
					class="w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">
					{cancelling ? m.queue_cancelling() : m.queue_leave()}
				</button>
			{/if}
		</div>
	{/if}
</div>

{#if configuringKind && flow.state === 'reserved' && flowKindId}
	<section data-guild={activity.creatorGuild} class="mx-4 mt-4 rounded-3xl bg-white p-6">
		<h3 class="text-xl font-semibold">{m.addons_title()}</h3>
		<p class="mt-2 font-medium">{configuringKind.name} · {formatPrice(configuringKind.price)}</p>
		{#if configuringKind.addons.length === 0}<p class="mt-3 text-sm">{m.addons_none()}</p>{/if}
		<div class="mt-4 space-y-5">
			{#each configuringKind.addons as addon (addon.id)}
				<fieldset>
					<legend class="font-semibold"
						>{addon.name}{#if addon.required}
							*{/if}</legend>
					{#if !addon.multipleAlternatives}
						<p class="mt-1 text-xs text-gray-500">{m.addon_choose_one()}</p>
					{/if}
					<div class="mt-2 space-y-2">
						{#each addon.options as option (option.id)}
							<label class="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
								<input
									type={addon.multipleAlternatives ? 'checkbox' : 'radio'}
									name={`addon-${addon.id}`}
									checked={(selectedOptions.get(addon.id) ?? []).includes(option.index)}
									onchange={(event) =>
										toggleOption(addon, option.index, event.currentTarget.checked)} />
								<span class="flex-1">{option.name}</span><span>{formatPrice(option.price)}</span>
							</label>
						{/each}
						{#if addon.hasTextField}
							<input
								type="text"
								value={selectedTexts.get(addon.id) ?? ''}
								oninput={(event) => updateText(addon, event.currentTarget.value)}
								placeholder={m.addon_text_placeholder()}
								class="w-full rounded-2xl border border-gray-200 px-4 py-3" />
						{/if}
					</div>
				</fieldset>
			{/each}
		</div>
		{#if addonError}<p class="mt-3 text-sm text-red-700" role="alert">{addonError}</p>{/if}
		<button
			type="button"
			onclick={confirmAddons}
			disabled={now >= flow.latestTransaction}
			class="mt-5 w-full rounded-full bg-guild-primary px-5 py-3.5 font-semibold text-guild-on-primary"
			>{m.addons_continue()}</button>
	</section>
{:else if !flowKindId}
	<section class="px-4 py-6">
		<p>{m.queue_expired()}</p>
		<button
			type="button"
			class="mt-4 rounded-full bg-guild-primary px-5 py-3 text-guild-on-primary"
			onclick={() => void replaceNavigation(Routes.ActivityTickets(activity.id))}
			>{m.activity_tickets_title()}</button>
	</section>
{/if}
