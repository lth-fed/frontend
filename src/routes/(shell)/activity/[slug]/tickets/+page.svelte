<script lang="ts">
	import TicketKindCard from '$lib/components/TicketKindCard.svelte';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';
	import type { TicketKind } from '$lib/api';
	import { serverNow } from '$lib/api/serverClock';
	import { deriveKindState } from '$lib/purchase/kindState';
	import {
		acknowledge,
		cancel,
		configurePurchase,
		joinQueue,
		pay,
		purchase,
		resync,
		setAttached
	} from '$lib/purchase/purchase.svelte';
	import { freeGateway, paidGatewayFor } from '$lib/payment/gateway';
	import { formatPrice } from '$lib/format/money';
	import { replaceNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { AvailableAddon } from '$lib/api/activities';
	import { errorMessage } from '$lib/api/errors';

	let { data }: PageProps = $props();
	const activity = $derived(data.activity);
	const flow = $derived(purchase.flow);
	const flowKindId = $derived('kind' in flow ? flow.kind.ticketKindId : undefined);

	// Gating states are time-derived; tick so cards flip live when a
	// release window opens or sales close while the page is visible.
	let now = $state(serverNow());
	onMount(() => {
		const tick = setInterval(() => (now = serverNow()), 1_000);
		setAttached(true);
		return () => {
			clearInterval(tick);
			setAttached(false);
		};
	});

	/** Per-kind inline 400 message from the last attempt (spec §7). */
	const errors = new SvelteMap<string, string>();
	let busyKindId = $state<string | null>(null);

	// Landing a purchase (free or via reservation) sends the user home
	// to the ticket carousel.
	$effect(() => {
		if (flow.state === 'purchased') {
			acknowledge();
			void replaceNavigation(Routes.Home, { resetDepth: true });
		}
	});

	// All purchases go through the queue/reservation machine (spec §4.2) —
	// the backend routes free tickets through reservations too; the machine
	// auto-completes those with `provider: 'free'`.
	let configuringKind = $state<TicketKind | undefined>();
	const selectedOptions = new SvelteMap<string, number[]>();
	const selectedTexts = new SvelteMap<string, string>();
	let addonError = $state('');

	function beginBuy(kind: TicketKind) {
		selectedOptions.clear();
		selectedTexts.clear();
		void handleBuy(kind);
	}

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
		if (!kind) return;
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
		promptedPaymentKindId = undefined;
		configurePurchase(addons, totalPrice !== 0);
	}

	async function handleBuy(kind: TicketKind) {
		if (busyKindId) return;
		errors.delete(kind.id);
		busyKindId = kind.id;
		try {
			const error = await joinQueue(
				{
					ticketKindId: kind.id,
					activityId: activity.id,
					name: kind.name,
					requiresPayment: kind.price !== 0
				},
				kind.purchasingAvailableStart
			);
			if (error) errors.set(kind.id, error);
		} catch (cause) {
			errors.set(kind.id, errorMessage(cause) ?? m.error_status_unknown());
		} finally {
			busyKindId = null;
		}
	}

	function mmss(until: Date): string {
		const total = Math.max(0, Math.floor((until.getTime() - now.getTime()) / 1000));
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	// Payment confirmation (krav §6 "test view"): the complete frontend
	// selection determines whether a paid provider is needed.
	let confirmingPay = $state(false);
	let payError = $state<string | undefined>(undefined);
	let promptedPaymentKindId = $state<string | undefined>(undefined);
	let promptedAddonKindId = $state<string | undefined>(undefined);
	let cancelling = $state(false);
	let cancelError = $state<string | undefined>(undefined);

	async function handleCancel() {
		if (cancelling) return;
		cancelling = true;
		cancelError = undefined;
		try {
			await cancel();
		} catch (cause) {
			cancelError = errorMessage(cause) ?? m.queue_cancel_failed();
		} finally {
			cancelling = false;
		}
	}

	async function tryFreePayment() {
		payError = undefined;
		if (flow.state !== 'reserved') return;
		const { error } = await pay(freeGateway);
		if (error) payError = error;
	}

	function openOrRetryPayment() {
		if (flow.state !== 'reserved') return;
		const kind = data.ticketKinds.find((candidate) => candidate.id === flow.kind.ticketKindId);
		if (kind?.addons.length && flow.kind.addons === undefined) {
			openAddonConfiguration(kind);
			return;
		}
		if (flow.paymentRequired) confirmingPay = true;
		else void tryFreePayment();
	}

	function changeAddons() {
		if (flow.state !== 'reserved') return;
		const kind = data.ticketKinds.find((candidate) => candidate.id === flow.kind.ticketKindId);
		if (!kind?.addons.length) return;
		confirmingPay = false;
		openAddonConfiguration(kind);
	}

	async function confirmPay(provider: 'swish' | 'stripe') {
		confirmingPay = false;
		payError = undefined;
		if (flow.state !== 'reserved') return;
		const { error } = await pay(paidGatewayFor(provider));
		if (error) payError = error;
	}

	$effect(() => {
		if (flow.state === 'idle') {
			promptedPaymentKindId = undefined;
			promptedAddonKindId = undefined;
		} else if (flow.state === 'reserved') {
			const kind = data.ticketKinds.find((candidate) => candidate.id === flow.kind.ticketKindId);
			if (
				kind?.addons.length &&
				flow.kind.addons === undefined &&
				promptedAddonKindId !== flow.kind.ticketKindId
			) {
				promptedAddonKindId = flow.kind.ticketKindId;
				openAddonConfiguration(kind);
			} else if (
				(!kind?.addons.length || flow.kind.addons !== undefined) &&
				promptedPaymentKindId !== flow.kind.ticketKindId
			) {
				promptedPaymentKindId = flow.kind.ticketKindId;
				if (flow.paymentRequired) confirmingPay = true;
				else void tryFreePayment();
			}
		}
	});

	useAppBars(() => ({
		topBar: detailTopBar({ title: activity.title }),
		bottom: emptyBottom
	}));
</script>

<div data-guild={activity.creatorGuild} class="flex w-full flex-col gap-3.75 px-4">
	<h2 class="text-[24px] font-semibold">{m.activity_tickets_title()}</h2>

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
				<p class="text-lg font-semibold text-guild-on-surface">
					{m.queue_pay_within({ time: mmss(flow.latestTransaction) })}
				</p>
				{#if serverNow() < flow.latestTransaction}
					<button
						type="button"
						onclick={openOrRetryPayment}
						class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary">
						{m.queue_pay_cta()}
					</button>
				{:else}
					<!-- inside the last minute: too late to safely start (spec §4.2) -->
					<p class="text-sm text-red-700">{m.queue_pay_too_late()}</p>
				{/if}
				{#if payError}
					<p class="text-sm text-red-700" role="alert">{payError}</p>
				{/if}
			{:else if flow.state === 'paying'}
				<p class="text-sm text-guild-on-surface/80">{m.pill_paying()}</p>
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

			{#if flow.state === 'expired' || flow.state === 'failed'}
				<button
					type="button"
					onclick={acknowledge}
					class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
					{m.queue_dismiss()}
				</button>
			{:else if flow.state !== 'paying'}
				{#if cancelError}
					<p class="text-sm text-red-700" role="alert">{cancelError}</p>
				{/if}
				<button
					type="button"
					onclick={handleCancel}
					disabled={cancelling}
					class="w-full rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">
					{cancelling ? m.queue_cancelling() : m.queue_cancel()}
				</button>
			{/if}
		</div>
	{/if}

	<div class="flex w-full flex-col gap-2">
		{#each data.ticketKinds as ticketKind (ticketKind.id)}
			<TicketKindCard
				name={ticketKind.name}
				price={ticketKind.price}
				state={deriveKindState(ticketKind, now)}
				error={errors.get(ticketKind.id)}
				busy={busyKindId === ticketKind.id}
				inFlow={flowKindId === ticketKind.id}
				flowActive={flow.state !== 'idle'}
				onclick={() => beginBuy(ticketKind)} />
		{/each}
	</div>
</div>

{#if confirmingPay && flow.state === 'reserved' && flow.paymentRequired}
	<!-- Payment confirmation (krav §6). Backdrop button / Cancel dismisses. -->
	<div class="fixed inset-0 z-50 grid place-items-end justify-center sm:place-items-center">
		<button
			type="button"
			aria-label={m.queue_cancel()}
			class="absolute inset-0 h-full w-full bg-black/40"
			onclick={() => (confirmingPay = false)}></button>
		<div
			data-guild={activity.creatorGuild}
			class="relative w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl">
			<h3 class="text-lg font-semibold text-guild-on-surface">{m.pay_confirm_title()}</h3>
			<p class="mt-2 text-sm text-guild-on-surface/80">
				{m.pay_confirm_body()}
			</p>
			{#if getLocale() === 'en'}
				<p class="mt-3 rounded-2xl bg-guild-primary-light p-3 text-sm text-guild-on-surface/80">
					{m.pay_card_discouraged()}
				</p>
			{/if}
			<div class="mt-5 flex flex-col gap-2">
				{#if data.ticketKinds.find((kind) => kind.id === flow.kind.ticketKindId)?.addons.length}
					<button
						type="button"
						onclick={changeAddons}
						class="w-full rounded-full border border-guild-ring px-5 py-3 text-sm font-semibold text-guild-on-surface">
						{m.change_addons()}
					</button>
				{/if}
				{#if getLocale() === 'en'}
					<button
						type="button"
						onclick={() => confirmPay('swish')}
						class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary"
						>{m.pay_with_swish()}</button>
					<button
						type="button"
						onclick={() => confirmPay('stripe')}
						class="w-full rounded-full border border-guild-ring px-5 py-3.5 text-base font-semibold text-guild-on-surface"
						>{m.pay_with_stripe()}</button>
				{:else}
					<button
						type="button"
						onclick={() => confirmPay('swish')}
						class="w-full rounded-full bg-guild-primary px-5 py-3.5 text-base font-semibold text-guild-on-primary"
						>{m.pay_with_swish()}</button>
				{/if}
				<button
					type="button"
					onclick={() => (confirmingPay = false)}
					class="w-full rounded-full px-5 py-3 text-sm font-semibold text-guild-on-surface/70">
					{m.queue_cancel()}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if configuringKind}
	<div class="fixed inset-0 z-50 grid place-items-end justify-center sm:place-items-center">
		<button
			type="button"
			aria-label={m.queue_cancel()}
			class="absolute inset-0 bg-black/40"
			onclick={() => (configuringKind = undefined)}></button>
		<div
			class="relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
			<h3 class="text-xl font-semibold">{m.addons_title()}</h3>
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
				class="mt-5 w-full rounded-full bg-guild-primary px-5 py-3.5 font-semibold text-guild-on-primary"
				>{m.addons_continue()}</button>
		</div>
	</div>
{/if}
