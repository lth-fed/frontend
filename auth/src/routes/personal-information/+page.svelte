<script lang="ts">
	import { Button, Input, i18n } from 'common-lib';
	import { authApiUrl } from '$lib/api';
	import { m, personal_number } from '$lib/paraglide/messages';
	const l = $derived([undefined, { locale: i18n.getLang() }]);

	let freeze = $state(false);
	let inputError = $state(false);
	let whoops = $state(false);
	let name = $state('');
	let personalNumber = $state('');

	const query = new URLSearchParams(location.search);
	const sub = query.get('sub');

	async function click() {
		const body = {
			code: query.get('code'),
			name,
			personal_number: personalNumber == '' ? null : personalNumber
		};
		freeze = true;
		const resp = await fetch(authApiUrl('/api/v0/personal-information'), {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json; charset=utf-8'
			}
		});
		inputError = false;
		if (resp.ok) {
			location.href = await resp.text();
		} else if (resp.status === 400) {
			inputError = true;
			freeze = false;
		} else {
			whoops = true;
		}
	}
</script>

<p>
	{m.personal_information_description(...l)}
</p>
<p class="flex flex-col">
	<Input
		placeholder={m.mail_name(...l)}
		class={inputError ? 'border-3 border-red-300' : ''}
		bind:value={name}
		disabled={freeze}
		onkeydown={(e) => (e.key === 'Enter' ? click() : {})} />
</p>
{#if sub?.startsWith('lund-university:') || sub?.startsWith('test:')}
	<p class="flex flex-col">
		<Input
			placeholder={m.personal_number(...l)}
			class={inputError ? 'border-3 border-red-300' : ''}
			bind:value={personalNumber}
			disabled={freeze}
			onkeydown={(e) => (e.key === 'Enter' ? click() : {})} />
	</p>
{/if}
<Button class="mt-5 w-full" onclick={click} disabled={freeze}>{m.login(...l)}</Button>
{#if whoops}
	<p class="font-bold">
		{m.whoops(...l)}
	</p>
{/if}
