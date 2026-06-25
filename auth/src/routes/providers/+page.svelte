<script lang="ts">
	import { Button, i18n } from 'common-lib';
	import { m } from '$lib/paraglide/messages';
	const l = $derived([undefined, { locale: i18n.getLang() }]);

	const availableProviders = ['lu', 'email', 'test'];

	const query = new URLSearchParams(location.search);
	const providers =
		query
			.get('providers')
			?.split(' ')
			.filter((provider) => availableProviders.includes(provider)) ?? availableProviders;

	async function click(provider: string) {
		query.set('providers', provider);
		location.href = `/oidc/v1/authorize?${query.toString()}`;
	}
</script>

<p>
	{m.providers_description(...l)}
</p>
<div class="mt-4 flex flex-col gap-2">
	{#each providers as provider}
		<Button class="m-1 w-full text-left" onclick={(_) => click(provider)}
			>{m[`providers_${provider}`](...l)}</Button>
	{/each}
</div>

<div class="mt-4 flex flex-row justify-between gap-4"></div>
