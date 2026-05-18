<script lang="ts">
	interface Props {
		initials: string;
		onclick?: () => void;
		size?: 'sm' | 'md' | 'lg';
		label?: string;
	}

	let { initials, onclick, size = 'md', label }: Props = $props();

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
