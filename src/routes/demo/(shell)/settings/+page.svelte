<script lang="ts">
	import { Globe } from '@lucide/svelte';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	type Locale = (typeof locales)[number];

	// Native names — these don't get translated; each locale shows its own name.
	const nativeName: Record<Locale, string> = {
		en: 'English',
		sv: 'Svenska'
	};

	function toggleLocale() {
		const next: Locale = getLocale() === 'en' ? 'sv' : 'en';
		setLocale(next);
	}
</script>

<div class="flex w-full flex-col gap-3.75 px-4">
	<button
		type="button"
		onclick={toggleLocale}
		class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
	>
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-full bg-guild-primary-light text-guild-on-surface"
		>
			<Globe class="size-5" aria-hidden="true" />
		</div>
		<span class="flex-1 text-[16px] font-medium text-guild-on-surface">
			{m.settings_language()}
		</span>
		<span class="text-[16px] font-semibold text-guild-on-surface">
			{nativeName[getLocale()]}
		</span>
	</button>
</div>
