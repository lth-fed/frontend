<script lang="ts">
	import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
	import rehypeStringify from 'rehype-stringify';
	import remarkParse from 'remark-parse';
	import remarkRehype from 'remark-rehype';
	import { unified } from 'unified';

	const MAX_BYTES = 100_000;
	const schema = {
		...defaultSchema,
		tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img')
	};

	interface Props {
		markdown: string;
	}

	let { markdown }: Props = $props();

	function withinLimit(value: string): string {
		const bytes = new TextEncoder().encode(value);
		if (bytes.byteLength <= MAX_BYTES) return value;
		return new TextDecoder().decode(bytes.slice(0, MAX_BYTES));
	}

	const html = $derived(
		unified()
			.use(remarkParse)
			.use(remarkRehype)
			.use(rehypeSanitize, schema)
			.use(rehypeStringify)
			.processSync(withinLimit(markdown))
			.toString()
	);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- unified output is passed through rehype-sanitize immediately above -->
<div class="markdown text-[16px] font-normal">{@html html}</div>

<style>
	.markdown :global(p + p),
	.markdown :global(ul + p),
	.markdown :global(ol + p) {
		margin-top: 0.75rem;
	}

	.markdown :global(ul),
	.markdown :global(ol) {
		margin: 0.75rem 0;
		padding-left: 1.5rem;
	}

	.markdown :global(ul) {
		list-style: disc;
	}

	.markdown :global(ol) {
		list-style: decimal;
	}

	.markdown :global(a) {
		color: var(--color-guild-accent);
		font-weight: 600;
		text-decoration: underline;
	}

	.markdown :global(h1),
	.markdown :global(h2),
	.markdown :global(h3),
	.markdown :global(h4),
	.markdown :global(h5),
	.markdown :global(h6) {
		margin: 1.25rem 0 0.5rem;
		font-weight: 650;
		line-height: 1.25;
	}

	.markdown :global(h1) {
		border-bottom: 1px solid rgb(0 0 0 / 10%);
		padding-bottom: 0.35rem;
		font-size: 1.75rem;
	}

	.markdown :global(h2) {
		border-bottom: 1px solid rgb(0 0 0 / 8%);
		padding-bottom: 0.3rem;
		font-size: 1.45rem;
	}

	.markdown :global(h3) {
		font-size: 1.25rem;
	}

	.markdown :global(h4) {
		font-size: 1.1rem;
	}

	.markdown :global(h5) {
		font-size: 1rem;
	}

	.markdown :global(h6) {
		color: color-mix(in srgb, currentcolor 65%, transparent);
		font-size: 0.9rem;
	}

	.markdown :global(blockquote) {
		margin: 0.75rem 0;
		border-left: 3px solid var(--color-guild-ring);
		padding-left: 0.75rem;
	}

	.markdown :global(code) {
		border-radius: 0.25rem;
		background: rgb(0 0 0 / 6%);
		padding: 0.1rem 0.25rem;
	}
</style>
