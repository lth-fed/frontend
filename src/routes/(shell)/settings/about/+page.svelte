<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';

	// The most involved contributors, per docs/agreements/maintainers.md.
	// Update alongside that document when the maintainer list changes.
	const maintainers: { name: string; guild: string }[] = [
		{ name: 'Felix Hellborg', guild: 'F' },
		{ name: 'Åke Amcoff', guild: 'F' },
		{ name: 'Erik Davidsson', guild: 'E' },
		{ name: 'Axel Andersson', guild: 'E' },
		{ name: 'Simon Mechler', guild: 'D' }
	];

	const initials = (name: string) =>
		name
			.split(/\s+/)
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();

	useAppBars(() => ({
		topBar: detailTopBar({ title: m.about_title() }),
		bottom: emptyBottom
	}));
</script>

<div class="flex w-full flex-col gap-6 px-4 pb-8">
	<p class="text-[15px] leading-relaxed text-guild-on-surface">
		{m.about_description()}
	</p>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-guild-on-surface">{m.about_maintainers_title()}</h2>
		<ul class="flex flex-col gap-2">
			{#each maintainers as maintainer (maintainer.name)}
				<li
					class="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
					<div
						class="flex size-8 shrink-0 items-center justify-center rounded-full bg-guild-primary text-xs font-semibold text-guild-on-primary"
						aria-hidden="true">
						{initials(maintainer.name)}
					</div>
					<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
						{maintainer.name}
					</span>
					<span class="text-sm text-guild-on-surface/60">
						{m.about_maintainer_role({ guild: maintainer.guild })}
					</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-guild-on-surface">{m.about_source_title()}</h2>
		<p class="text-[15px] leading-relaxed text-guild-on-surface/80">
			{m.about_source_description()}
		</p>
		<a
			href="https://github.com/lth-fed"
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
			<div
				class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface">
				<ExternalLink class="size-5" aria-hidden="true" />
			</div>
			<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
				{m.about_source_link()}
			</span>
		</a>
	</section>
</div>
