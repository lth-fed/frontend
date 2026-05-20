<script lang="ts">
	import TicketDetail from './TicketDetail.svelte';
	import ToolBar from './ToolBar.svelte';
	import { ArrowLeftRight, Wallet, Receipt, PartyPopper } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	type Action = 'transfer' | 'wallet' | 'receipt' | 'event';

	interface Props {
		open: boolean;
		name: string;
		event: string;
		serial: string;
		qrData: string;
		onClose: () => void;
		onAction?: (id: Action) => void;
	}

	let { open, name, event, serial, qrData, onClose, onAction }: Props = $props();

	const tools = $derived([
		{ id: 'transfer' as Action, icon: ArrowLeftRight, label: m.tool_transfer() },
		{ id: 'wallet' as Action, icon: Wallet, label: m.tool_wallet() },
		{ id: 'receipt' as Action, icon: Receipt, label: m.tool_receipt() },
		{ id: 'event' as Action, icon: PartyPopper, label: m.tool_event() }
	]);

	function openAsModal(node: HTMLDialogElement) {
		node.showModal();

		return () => {
			if (node.open) node.close();
		};
	}

	function handleCancel(e: Event) {
		e.preventDefault();
		onClose();
	}
</script>

{#if open}
	<dialog
		class="ticket-modal z-50"
		oncancel={handleCancel}
		aria-label={m.modal_close_label()}
		{@attach openAsModal}
	>
		<button
			type="button"
			aria-label={m.modal_close_label()}
			onclick={onClose}
			class="absolute inset-0 bg-black/50"
		></button>
		<div
			class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
		>
			<div class="pointer-events-auto w-full max-w-[320px]">
				<TicketDetail {name} {event} {serial} {qrData} />
			</div>
			<div class="pointer-events-auto">
				<ToolBar items={tools} onAction={(id) => onAction?.(id)} />
			</div>
		</div>
	</dialog>
{/if}

<style>
	.ticket-modal {
		margin: 0;
		padding: 0;
		border: 0;
		width: 100dvw;
		height: 100dvh;
		max-width: none;
		max-height: none;
		background: transparent;
	}

	.ticket-modal::backdrop {
		background: rgb(0 0 0 / 0.5);
	}
</style>
