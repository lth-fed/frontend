<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { fromAction } from 'svelte/attachments';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		items: T[];
		item: Snippet<[T, boolean, () => void]>;
		empty?: Snippet;
	}

	let { items, item, empty }: Props = $props();

	let viewport = $state<HTMLDivElement>();
	let itemEls = $state<(HTMLElement | undefined)[]>([]);
	let current = $state(0);
	let itemScales = $state<number[]>([]);
	let spacerSize = $state(0);

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function updateState() {
		const root = viewport;
		if (!root) return;

		const referenceItem = itemEls.find((el) => el);
		const itemWidth = referenceItem?.offsetWidth ?? 300;
		spacerSize = Math.max(0, (root.clientWidth - itemWidth) / 2);

		const center = root.scrollLeft + root.clientWidth / 2;
		let bestIndex = 0;
		let bestDist = Infinity;
		const nextScales = items.map((_, i) => {
			const el = itemEls[i];
			if (!el) return 0.86;
			const itemCenter = el.offsetLeft + el.offsetWidth / 2;
			const dist = Math.abs(center - itemCenter);
			if (dist < bestDist) {
				bestDist = dist;
				bestIndex = i;
			}
			const proximity = clamp(1 - dist / Math.max(root.clientWidth / 2, 1), 0, 1);
			return 0.86 + proximity * 0.14;
		});

		itemScales = nextScales;
		if (bestIndex !== current) current = bestIndex;
	}

	function viewportAction(node: HTMLDivElement) {
		viewport = node;
		let frame: number | null = null;

		function onScroll() {
			if (frame !== null) return;
			frame = requestAnimationFrame(() => {
				frame = null;
				updateState();
			});
		}

		updateState();
		node.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });

		return {
			destroy() {
				node.removeEventListener('scroll', onScroll);
				window.removeEventListener('resize', onScroll);
				if (frame !== null) cancelAnimationFrame(frame);
				if (viewport === node) viewport = undefined;
			}
		};
	}

	function itemAction(node: HTMLElement, index: number) {
		itemEls[index] = node;
		updateState();

		return {
			update(nextIndex: number) {
				if (nextIndex === index) return;
				if (itemEls[index] === node) itemEls[index] = undefined;
				index = nextIndex;
				itemEls[index] = node;
				updateState();
			},
			destroy() {
				if (itemEls[index] === node) itemEls[index] = undefined;
				updateState();
			}
		};
	}

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
			{@attach fromAction(viewportAction)}
			class="snap-x snap-mandatory overflow-visible overflow-x-auto pt-4 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<div class="flex w-max gap-1.5">
				<div class="shrink-0" style="width: {spacerSize}px;" aria-hidden="true"></div>
				{#each items as it, i (i)}
					<div
						{@attach fromAction(itemAction, () => i)}
						class="shrink-0 snap-center snap-always overflow-visible transition-transform duration-200 ease-out will-change-transform"
						style={`transform: scale(${itemScales[i] ?? 0.86});`}
					>
						{@render item(it, i === current, () => goTo(i))}
					</div>
				{/each}
				<div class="shrink-0" style="width: {spacerSize}px;" aria-hidden="true"></div>
			</div>
		</div>

		<div class="-mt-24 flex justify-center gap-2">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each items as _, i (i)}
				<button
					type="button"
					onclick={() => goTo(i)}
					aria-label={m.carousel_slide_label({ n: i + 1 })}
					class="size-2 rounded-full transition-colors {current === i
						? 'bg-guild-primary ring-(length:--guild-ring-width) ring-guild-ring'
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
