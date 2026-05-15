<script lang="ts">
	import type { Pathname } from '$app/types'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { getLocale, locales, localizeHref, setLocale } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages.js'
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg'
	import { Button, Link, i18n } from 'common-lib'

	function setLang(lang: 'sv' | 'en') {
		i18n.setLang(lang)
		setLocale(lang, { reload: false })
	}
	const l = $derived([undefined, { locale: i18n.getLang() }])
	let { children } = $props()
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Button
	class="absolute top-4 right-6"
	onclick={() => setLang(i18n.getLang() === 'sv' ? 'en' : 'sv')}>{m.other_lang(...l)}</Button>
<div class="grid min-h-full grid-rows-[1fr_auto]">
	<div class="flex h-full flex-col items-center">
		<div class="mt-32 mb-16 max-w-md rounded-xl bg-gray-100 p-8 drop-shadow-2xl flex flex-col">
			<h1 class="pb-4 text-2xl">{m.title(...l)}</h1>
			{@render children()}
		</div>
	</div>
	<div class="sticky bottom-0 flex h-10 w-full flex-row justify-between bg-gray-100 p-2">
		<div>
			<Link href="/privacy-statement/">{m.privacy_statement(...l)}</Link>
		</div>
		<div>{m.copyright(...l)}</div>
	</div>
</div>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
