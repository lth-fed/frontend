<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		items: T[];
		item: Snippet<[T]>;
		empty?: Snippet;
	}

	let { items, item, empty }: Props = $props();

	let viewport = $state<HTMLDivElement>();
	let itemEls = $state<HTMLElement[]>([]);
	let current = $state(0);

	$effect(() => {
		const root = viewport;
		if (!root) return;

		let frame: number | null = null;

		function updateCurrent() {
			if (!root) return;
			const center = root.scrollLeft + root.clientWidth / 2;
			let bestIndex = 0;
			let bestDist = Infinity;
			for (let i = 0; i < itemEls.length; i++) {
				const el = itemEls[i];
				if (!el) continue;
				const itemCenter = el.offsetLeft + el.offsetWidth / 2;
				const dist = Math.abs(center - itemCenter);
				if (dist < bestDist) {
					bestDist = dist;
					bestIndex = i;
				}
			}
			if (bestIndex !== current) current = bestIndex;
		}

		function onScroll() {
			if (frame !== null) return;
			frame = requestAnimationFrame(() => {
				frame = null;
				updateCurrent();
			});
		}

		updateCurrent();
		root.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			root.removeEventListener('scroll', onScroll);
			if (frame !== null) cancelAnimationFrame(frame);
		};
	});

	function goTo(i: number) {
		itemEls[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
	}
</script>

{#if items.length === 0 && empty}
	<div class="centered">
		{@render empty()}
	</div>
{:else}
	<div class="space-y-4">
		<div
			bind:this={viewport}
			class="snap-x snap-mandatory overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<div class="centered flex w-max gap-4">
				{#each items as it, i (i)}
					<div bind:this={itemEls[i]} class="shrink-0 snap-center snap-always">
						{@render item(it)}
					</div>
				{/each}
			</div>
		</div>

		<div class="flex justify-center gap-2">
			{#each items as _, i (i)}
				<button
					type="button"
					onclick={() => goTo(i)}
					aria-label={m.carousel_slide_label({ n: i + 1 })}
					class="size-2 rounded-full transition-colors {current === i
						? 'bg-guild-primary ring-[length:var(--guild-ring-width)] ring-guild-ring'
						: 'bg-gray-300'}"
				></button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.centered {
		padding-inline: calc(50% - var(--carousel-item-width, 300px) / 2);
	}
</style>
