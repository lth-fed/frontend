<script lang="ts">
	import { Button, Input, i18n } from 'common-lib'
	import { m } from '$lib/paraglide/messages'
	const l = $derived([undefined, { locale: i18n.getLang() }])

	let freeze = $state(false)
	let inputError = $state(false)
	let continueToMail = $state(false)
	let whoops = $state(false)
	let email = $state('')
	let name = $state('')

	const query = new URLSearchParams(location.search)

	async function click() {
		const body = {
			id: query.get('id'),
			email,
			name
		}
		freeze = true
		const resp = await fetch('/api/v0/providers/email/login', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json; charset=utf-8'
			}
		})
		inputError = false
		if (resp.ok) {
			continueToMail = true
		} else if (resp.status === 400) {
			inputError = true
			freeze = false
		} else {
			whoops = true
		}
	}
</script>

<p>
	{m.mail_description(...l)}
</p>
<p class="flex flex-col">
	<Input
		placeholder={m.mail_mail(...l)}
		class={inputError ? 'border border-3 border-red-300' : ''}
		bind:value={email}
		type="email"
		disabled={freeze} />
</p>
<p class="flex flex-col">
	<Input
		placeholder={m.mail_name(...l)}
		class={inputError ? 'border border-3 border-red-300' : ''}
		bind:value={name}
		disabled={freeze}
		onkeydown={(e) => (e.key === 'Enter' ? click() : {})} />
</p>
<Button class="mt-5 w-full" onclick={click} disabled={freeze}>{m.login(...l)}</Button>
{#if continueToMail}
	<p class="font-bold">
		{m.mail_close_page(...l)}
	</p>
{/if}
{#if whoops}
	<p class="font-bold">
		{m.whoops(...l)}
	</p>
{/if}
