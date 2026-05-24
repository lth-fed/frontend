<script lang="ts">
	import { initialsFromStilId } from '$lib/format/user';

	/**
	 * Prop matches the api `Me.id` shape so a caller can pass it
	 * straight through without computing display initials at the call
	 * site. Mirrors how `<Ticket>` accepts `id` / `timeStart` and
	 * formats internally.
	 */
	interface Props {
		userId: string | null | undefined;
		onclick?: () => void;
		size?: 'sm' | 'md' | 'lg';
		label?: string;
	}

	let { userId, onclick, size = 'md', label }: Props = $props();

	/** `?` keeps the badge non-empty when the id doesn't fit the LU
	 *  shape (e.g. an email-provider id) — otherwise the round button
	 *  reads as a styling bug. */
	const initials = $derived(initialsFromStilId(userId) ?? '?');

	const sizes = {
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm',
		lg: 'size-12 text-base'
	};

	const base =
		'bg-guild-primary text-guild-on-primary ring-guild-ring inline-flex items-center justify-center rounded-full font-bold ring-[length:var(--guild-ring-width)]';
</script>

{#if onclick}
	<button type="button" {onclick} aria-label={label} class="{base} {sizes[size]}">
		{initials}
	</button>
{:else}
	<div class="{base} {sizes[size]}" aria-label={label}>{initials}</div>
{/if}
