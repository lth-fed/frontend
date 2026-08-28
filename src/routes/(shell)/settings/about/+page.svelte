<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { detailTopBar, emptyBottom, useAppBars } from '$lib/state/appBars.svelte';

	// The most involved contributors, per docs/agreements/maintainers.md.
	// Update alongside that document when the maintainer list changes.
	const maintainers: { name: string; guild: string }[] = [
		{ name: 'Erik Davidsson', guild: 'E' },
		{ name: 'Åke Amcoff', guild: 'F' },
		{ name: 'Axel Andersson', guild: 'E' },
		{ name: 'Simon Mechler', guild: 'D' },
		{ name: 'Felix Hellborg', guild: 'F' }
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
		<p class="text-sm text-guild-on-surface/60">
			{m.about_version()}: <code>{__GIT_REVISION__}</code>
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

	<section class="flex flex-col gap-3">
		<h2 class="text-lg font-semibold text-guild-on-surface">{m.about_legal_title()}</h2>
		<article
			class="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
			<h3 class="text-[16px] font-semibold text-guild-on-surface">
				{m.about_withdrawal_title()}
			</h3>
			<p class="text-[15px] leading-relaxed text-guild-on-surface/80">
				{m.about_withdrawal_description()}
			</p>
			<a
				href="https://lagen.nu/2005:59#K2R11"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-2 font-semibold text-guild-accent underline decoration-current underline-offset-2">
				{m.about_withdrawal_law_link()}
				<ExternalLink class="size-4" aria-hidden="true" />
			</a>
			<p class="border-t border-gray-100 pt-3 text-[15px] leading-relaxed text-guild-on-surface/80">
				{m.about_complaints_description()}
			</p>
		</article>

		<div class="grid gap-3 sm:grid-cols-2">
			<article
				class="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
				<h3 class="mb-3 text-[16px] font-semibold text-guild-on-surface">
					{m.about_company_title()}
				</h3>
				<strong class="text-[15px] text-guild-on-surface">E-sektionen inom TLTH</strong>
				<p class="mt-1 text-sm text-guild-on-surface/70">
					{m.about_organisation_number()}: 845001-2284
				</p>
				<address class="mt-3 text-sm leading-relaxed text-guild-on-surface/70 not-italic">
					Edekvata, plan B i E-huset, LTH<br />
					Ole Römers väg 3B<br />
					223 63 Lund
				</address>
			</article>

			<div class="flex flex-col gap-3">
				<article
					class="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
					<h3 class="mb-2 text-[16px] font-semibold text-guild-on-surface">
						{m.about_payment_title()}
					</h3>
					<p class="text-sm text-guild-on-surface/70">
						{m.about_swish_number()}: <strong>1234994018</strong>
					</p>
					<p class="mt-2 text-sm leading-relaxed text-guild-on-surface/70">
						{m.about_vat_description()}
					</p>
				</article>

				<article
					class="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]">
					<h3 class="mb-2 text-[16px] font-semibold text-guild-on-surface">
						{m.about_contact_title()}
					</h3>
					<p class="text-sm leading-relaxed text-guild-on-surface/70">
						{m.about_contact_description()}
						<a class="font-medium text-guild-accent" href="mailto:info@esek.se">info@esek.se</a>.
					</p>
				</article>
			</div>
		</div>
	</section>
</div>
