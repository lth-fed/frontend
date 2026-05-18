<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		image: string;
		title: string;
		description: string;
		url: string;
	}

	let { image, title, description, url }: Props = $props();
</script>

<a
	href={url}
	target="_blank"
	rel="noopener noreferrer"
	aria-label={m.links_open_external({ title })}
	class="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-md"
>
	<img src={image} alt="" class="size-20 shrink-0 rounded-xl object-cover" />

	<div class="relative min-w-0 flex-1 self-stretch py-1 pr-6">
		<ExternalLink
			class="absolute top-0 right-0 size-4 text-guild-accent"
			aria-hidden="true"
		/>
		<h3 class="line-clamp-1 pr-6 text-base leading-tight font-bold">{title}</h3>
		<p class="mt-1.5 line-clamp-2 text-sm text-gray-600">{description}</p>
	</div>
</a>
