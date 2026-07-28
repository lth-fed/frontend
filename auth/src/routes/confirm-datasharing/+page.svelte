<script lang="ts">
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { Button, i18n } from 'common-lib';
	import { AUTH_API_ORIGIN } from '$lib/api';
	import { m } from '$lib/paraglide/messages';
	const l = $derived([undefined, { locale: i18n.getLang() }]);

	let whoops = $state(false);
	const query = new URLSearchParams(location.search);
	const provider = query.get('provider') ?? 'https://example.org';

	async function click(accepted: boolean) {
		const body = {
			code: query.get('code'),
			accepted
		};
		const resp = await fetch(`${AUTH_API_ORIGIN}/oidc/v1/confirm-datasharing`, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(body),
			headers: {
				'content-type': 'application/json; charset=utf-8'
			}
		});
		if (!resp.ok) {
			whoops = true;
			return;
		}
		const { url } = await resp.json();
		parent.postMessage({ kind: 'validation', validated: true }, '*');
		location.href = url;
	}
</script>

<p>
	<ParaglideMessage
		message={m.confirm_description}
		inputs={{}}
		options={{ locale: i18n.getLang() }}>
		{#snippet origin()}
			<span class="font-bold text-nowrap">{provider}</span>
		{/snippet}
	</ParaglideMessage>
</p>
<hr />
<p>
	<ParaglideMessage message={m.confirm_access} inputs={{}} options={{ locale: i18n.getLang() }}>
		{#snippet origin()}
			<span class="font-bold text-nowrap">{provider}</span>
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
