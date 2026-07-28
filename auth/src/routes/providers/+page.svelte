<script lang="ts">
	import { Button, i18n } from 'common-lib';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { AUTH_API_ORIGIN } from '$lib/api';
	import { m } from '$lib/paraglide/messages';
	const l = $derived([undefined, { locale: i18n.getLang() }]);

	const availableProviders = ['lu', 'email', 'test'] as const;
	type Provider = (typeof availableProviders)[number];

	const isProvider = (provider: string): provider is Provider =>
		(availableProviders as readonly string[]).includes(provider);

	const query = new SvelteURLSearchParams(location.search);
	const providers: readonly Provider[] =
		query.get('providers')?.split(' ').filter(isProvider) ?? availableProviders;

	async function click(provider: Provider) {
		query.set('providers', provider);
		location.href = `${AUTH_API_ORIGIN}/oidc/v1/authorize?${query.toString()}`;
	}
</script>

<p>
	{m.providers_description(...l)}
</p>
<div class="mt-4 flex flex-col gap-2">
	{#each providers as provider (provider)}
		<Button class="m-1 w-full text-left" onclick={(_) => click(provider)}
			>{m[`providers_${provider}`](...l)}</Button>
	{/each}
</div>

<div class="mt-4 flex flex-row justify-between gap-4"></div>
