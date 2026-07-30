<script lang="ts">
	import { Button, Input, i18n } from 'common-lib';
	import { m } from '$lib/paraglide/messages';
	const l = $derived([undefined, { locale: i18n.getLang() }]);

	let whoops = $state(false);
	let stil_id = $state('');
	let name = $state('');

	const query = new URLSearchParams(location.search);

	const sid = /[a-zA-Z][a-zA-Z][0-9]{4}[a-zA-Z][a-zA-Z]-s/;

	async function click() {
		if (!sid.test(stil_id)) {
			alert('Välj ett korrekt stil-id. Tack!');
			return;
		}
		const body = {
			code: query.get('code'),
			stil_id: stil_id.toLowerCase(),
			name
		};
		const resp = await fetch('/api/v0/providers/test/approve', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json; charset=utf-8'
			}
		});
		if (!resp.ok) {
			whoops = true;
			return;
		}
		const url = await resp.text();
		parent.postMessage({ kind: 'validation', validated: true }, '*');
		location.href = url;
	}
</script>

<p class="flex flex-col">
	<Input placeholder="aa0000bb-s" bind:value={stil_id} />
</p>
<p class="flex flex-col">
	<Input
		placeholder={m.mail_name(...l)}
		bind:value={name}
		onkeydown={(e) => (e.key === 'Enter' ? click() : {})} />
</p>
<Button class="mt-5 w-full" onclick={click}>{m.login(...l)}</Button>
{#if whoops}
	<p class="font-bold">
		{m.whoops(...l)}
	</p>
{/if}
