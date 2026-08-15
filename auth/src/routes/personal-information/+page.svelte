<script lang="ts">
	import { Button, Input, i18n } from 'common-lib';
	import { authApiUrl, errorMsg } from '$lib/api';
	import { m } from '$lib/paraglide/messages';
	const l = $derived([undefined, { locale: i18n.getLang() }]);

	let freeze = $state(false);
	let inputError: string | null = $state(null);
	let whoops = $state('');
	let name = $state('');
	let personalNumber = $state('');

	const query = new URLSearchParams(location.search);
	const sub = query.get('sub');

	async function click() {
		let personal_number;
		if (personalNumber === '') {
			personal_number = null;
		} else {
			personal_number = personalNumber.replaceAll('-', '').replaceAll(' ', '');
			if (personal_number.length === 12) {
				personal_number = personal_number.slice(2);
			}
		}
		const body = {
			code: query.get('code'),
			name,
			personal_number
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
		inputError = null;
		const respTxt = await resp.text();
		if (resp.ok) {
			location.href = respTxt;
		} else if (resp.status === 400) {
			const err = errorMsg(respTxt);
			whoops = err.message;
			inputError = err.field;
			freeze = false;
		} else {
			whoops = errorMsg(respTxt).message;
		}
	}
</script>

<p>
	{m.personal_information_description(...l)}
</p>
<p class="flex flex-col">
	<Input
		placeholder={m.mail_name(...l)}
		class={inputError === 'name' ? 'border-3 border-red-300' : ''}
		bind:value={name}
		disabled={freeze}
		onkeydown={(e) => (e.key === 'Enter' ? click() : {})} />
</p>
{#if sub?.startsWith('lund-university:') || sub?.startsWith('test:')}
	<p class="flex flex-col">
		<Input
			placeholder={m.personal_number(...l)}
			class={inputError === 'personal_number' ? 'border-3 border-red-300' : ''}
			bind:value={personalNumber}
			disabled={freeze}
			onkeydown={(e) => (e.key === 'Enter' ? click() : {})} />
	</p>
{/if}
<Button class="mt-5 w-full" onclick={click} disabled={freeze}>{m.login(...l)}</Button>
{#if whoops}
	<p class="font-bold">
		{whoops}
	</p>
{/if}
