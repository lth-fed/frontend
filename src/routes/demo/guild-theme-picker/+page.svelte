<script lang="ts">
	import type { Guild } from '$lib/types/guild';
	import { session } from '$lib/state/session.svelte';

	const themes: { key: Guild | null; label: string }[] = [
		{ key: null, label: 'Neutral' },
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
</script>

<main class="p-8">
	<h1 class="mb-2 text-2xl font-bold">Guild theme picker</h1>
	<p class="mb-6 text-sm text-gray-600">
		Selects the active guild theme on <code>session.guild</code>. The choice persists across demo
		pages.
	</p>

	<div class="flex flex-wrap gap-2">
		{#each themes as t (t.key ?? 'neutral')}
			{@const active = session.guild === t.key}
			<button
				type="button"
				onclick={() => (session.guild = t.key)}
				data-guild={t.key ?? undefined}
				aria-label="Select guild {t.label}"
				aria-pressed={active}
				class="rounded-full px-4 py-1.5 text-sm font-bold {active
					? 'bg-guild-primary text-guild-on-primary ring-2 ring-guild-ring'
					: 'bg-guild-surface text-guild-on-surface'}"
			>
				{t.label}
			</button>
		{/each}
	</div>
</main>
