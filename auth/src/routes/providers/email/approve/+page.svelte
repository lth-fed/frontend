<script lang="ts">
	import { i18n } from 'common-lib'
	import { m } from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	const l = $derived([undefined, { locale: i18n.getLang() }])

	let whoops = $state(false)

	const query = new URLSearchParams(location.search)

	async function approve() {
		const body = {
			token: query.get('token')
		}
		const resp = await fetch('/api/v0/providers/email/approve', {
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
	onMount(approve)
</script>

{#if whoops}
	<p class="font-bold">
		{m.whoops(...l)}
	</p>
{/if}
