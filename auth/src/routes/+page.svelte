<script>
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte'
	import { i18n, Link } from 'common-lib'
	import { m } from '$lib/paraglide/messages'
	const l = $derived([undefined, { locale: i18n.getLang() }])
</script>

<p>
	<ParaglideMessage message={m.description} inputs={{}} options={{ locale: i18n.getLang() }}>
		{#snippet link({ children })}
			<Link href="https://teknologappen.se">{@render children?.()}</Link>
		{/snippet}
	</ParaglideMessage>
</p>
