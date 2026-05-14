<script lang="ts">
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte'
	import { Button, i18n } from 'common-lib'
	import { confirm_description, m } from '$lib/paraglide/messages'
	const l = $derived([undefined, { locale: i18n.getLang() }])

	const query = new URLSearchParams(location.search)

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
			alert('Something went wrong!')
			return
		}
		const url = await resp.text()
		parent.postMessage({ kind: 'validation', validated: true }, '*')
		location.href = url
	}
</script>

<div class="max-w-sm">
	<h1 class="pb-4 text-2xl">{m.title(...l)}</h1>
	<p>
		<ParaglideMessage message={m.confirm_description} inputs={{}} options={{locale: i18n.getLang()}}>
			{#snippet origin()}
				<span class="font-bold text-nowrap">{query.get('origin') ?? "https://example.org"}</span>
			{/snippet}
		</ParaglideMessage>
	</p>
	<hr />
	<p>
		<ParaglideMessage message={m.confirm_access} inputs={{}} options={{locale: i18n.getLang()}}>
			{#snippet origin()}
				<span class="font-bold text-nowrap">{query.get('origin') ?? "https://example.org"}</span>
			{/snippet}
		</ParaglideMessage>
	</p>
	<ul class="list-inside list-['-_']">
		<li>{m.confirm_name(...l)}</li>
		<li>{m.confirm_mail(...l)}</li>
	</ul>

	<div class="mt-4 flex flex-row justify-between gap-8">
		<Button class="w-full bg-red-200 saturate-80" onclick={(_) => click(false)}
			>{m.cancel(...l)}</Button>
		<Button class="w-full bg-green-200 saturate-50" onclick={(_) => click(true)}
			>{m.allow(...l)}</Button>
	</div>
</div>
