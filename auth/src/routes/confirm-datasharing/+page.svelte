<script lang="ts">
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte'
	import { Button, i18n } from 'common-lib'
	import { m } from '$lib/paraglide/messages'
	const l = $derived([undefined, { locale: i18n.getLang() }])

	let whoops = $state(false)
	const query = new URLSearchParams(location.search)
	const originUrl = query.get('origin') ?? 'https://example.org'

	async function click(accepted: boolean) {
		const body = {
			id: query.get('id'),
			accepted
		}
		const resp = await fetch('/api/v0/confirm-datasharing', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json; charset=utf-8'
			}
		})
		if (!resp.ok) {
			whoops = true
			return
		}
		const url = await resp.text()
		parent.postMessage({ kind: 'validation', validated: true }, '*')
		location.href = url
	}
	// we want to automatically allow teknologappen the login details
	// this should be fine with GDPR, since it says so in our privacy statement and it's
	// also critical for the service we're offering
	//(selling tickets, which requires a name to make a valid transaction)
	if (originUrl === 'https://teknologappen.se') click(true)
</script>

<p>
	<ParaglideMessage
		message={m.confirm_description}
		inputs={{}}
		options={{ locale: i18n.getLang() }}>
		{#snippet origin()}
			<span class="font-bold text-nowrap">{originUrl}</span>
		{/snippet}
	</ParaglideMessage>
</p>
<hr />
<p>
	<ParaglideMessage message={m.confirm_access} inputs={{}} options={{ locale: i18n.getLang() }}>
		{#snippet origin()}
			<span class="font-bold text-nowrap">{originUrl}</span>
		{/snippet}
	</ParaglideMessage>
</p>
<ul class="list-inside list-['-_']">
	<li>{m.confirm_name(...l)}</li>
	<li>{m.confirm_mail(...l)}</li>
</ul>

<div class="mt-4 flex flex-row justify-between gap-4">
	<Button
		class="w-full border-red-200 from-red-200 to-red-300 saturate-80"
		onclick={(_) => click(false)}>{m.cancel(...l)}</Button>
	<Button
		class="w-full border-green-200 from-green-200 to-green-300 saturate-50"
		onclick={(_) => click(true)}>{m.allow(...l)}</Button>
</div>
{#if whoops}
	<p class="font-bold">
		{m.whoops(...l)}
	</p>
{/if}
