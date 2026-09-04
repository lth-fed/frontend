<script lang="ts">
	let { text }: { text: string } = $props();

	type Segment = { text: string; href?: string };

	function linkify(value: string): Segment[] {
		const segments: Segment[] = [];
		const links = /(?:https?:\/\/|www\.)[^\s<>"']+/giu;
		let offset = 0;
		for (const match of value.matchAll(links)) {
			const index = match.index;
			if (index > offset) segments.push({ text: value.slice(offset, index) });
			const raw = match[0];
			const trailing = raw.match(/[),.;!?]+$/u)?.[0] ?? '';
			const link = trailing ? raw.slice(0, -trailing.length) : raw;
			segments.push({ text: link, href: link.startsWith('www.') ? `https://${link}` : link });
			if (trailing) segments.push({ text: trailing });
			offset = index + raw.length;
		}
		if (offset < value.length) segments.push({ text: value.slice(offset) });
		return segments;
	}

	const segments = $derived(linkify(text));
</script>

{#each segments as segment, index (`${index}:${segment.text}`)}
	{#if segment.href}
		<a
			href={segment.href}
			target="_blank"
			rel="noopener noreferrer"
			class="pointer-events-auto font-medium text-guild-accent underline underline-offset-2"
			onclick={(event) => event.stopPropagation()}>{segment.text}</a>
	{:else}{segment.text}{/if}
{/each}
