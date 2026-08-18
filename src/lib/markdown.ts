import remarkParse from 'remark-parse';
import { unified } from 'unified';

type MarkdownNode = {
	type: string;
	value?: string;
	alt?: string | null;
	children?: MarkdownNode[];
};

const parser = unified().use(remarkParse);
const separatedNodes = new Set([
	'root',
	'paragraph',
	'heading',
	'blockquote',
	'list',
	'listItem',
	'table',
	'tableRow'
]);

function extractText(node: MarkdownNode): string {
	if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
		return node.value ?? '';
	}
	if (node.type === 'image') return node.alt ?? '';
	if (node.type === 'break') return ' ';
	if (!node.children) return '';
	return node.children.map(extractText).join(separatedNodes.has(node.type) ? ' ' : '');
}

/** Convert Markdown to compact readable text for cards and other previews. */
export function markdownToPlainText(markdown: string): string {
	return extractText(parser.parse(markdown) as MarkdownNode)
		.replace(/\s+/g, ' ')
		.trim();
}
