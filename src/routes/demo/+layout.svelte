<script lang="ts">
	import type { Guild } from '$lib/types/guild';
	import { session } from '$lib/state/session.svelte';

	let { children } = $props();

	const themes: { key: Guild | null; label: string }[] = [
		{ key: null, label: '—' },
		{ key: 'f', label: 'F' },
		{ key: 'e', label: 'E' },
		{ key: 'm', label: 'M' },
		{ key: 'v', label: 'V' },
		{ key: 'a', label: 'A' },
		{ key: 'k', label: 'K' },
		{ key: 'd', label: 'D' },
		{ key: 'ing', label: 'Ing' },
		{ key: 'w', label: 'W' },
		{ key: 'i', label: 'I' }
	];

	$effect(() => {
		session.guild = 'f';
		return () => (session.guild = null);
	});
</script>

{@render children()}

<div class="pointer-events-none fixed inset-x-0 bottom-2 z-50 flex justify-center px-2">
	<div
		class="pointer-events-auto flex gap-1 overflow-x-auto rounded-full bg-white/90 p-1 shadow-lg ring-1 ring-black/10 backdrop-blur"
	>
		{#each themes as t (t.key ?? 'neutral')}
			{@const active = session.guild === t.key}
			<button
				type="button"
				onclick={() => (session.guild = t.key)}
				data-guild={t.key ?? undefined}
				aria-label="Preview guild {t.label}"
				aria-pressed={active}
				class="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-opacity {active
					? 'bg-guild-primary text-guild-on-primary ring-1 ring-guild-ring'
					: 'bg-guild-surface text-guild-on-surface opacity-50 hover:opacity-100'}"
			>
				{t.label}
			</button>
		{/each}
	</div>
</div>
