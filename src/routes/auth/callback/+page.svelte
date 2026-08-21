<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { finishWebLogin, startLogin } from '$lib/auth/bootstrap';
	import { replaceNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();
	let runtimeError = $state<string | null>(null);
	const exchangeError = $derived(data.error ?? runtimeError);

	onMount(() => {
		if (exchangeError) return;
		void completeLogin();
	});

	async function completeLogin(): Promise<void> {
		try {
			if (await finishWebLogin()) {
				await replaceNavigation(Routes.Root, { resetDepth: true });
				return;
			}
			runtimeError = 'exchange_failed';
		} catch (error) {
			console.error('Login callback failed', error);
			runtimeError = error instanceof Error ? error.message : 'exchange_failed';
		}
	}
</script>

<div class="grid min-h-screen place-items-center px-6 text-center">
	{#if exchangeError}
		<div class="flex w-full max-w-sm flex-col items-center gap-4">
			<h1 class="text-xl font-semibold text-gray-900">{m.auth_error_title()}</h1>
			<p class="text-sm text-gray-600">{m.auth_error_failed()}</p>
			<details class="w-full text-left text-xs text-gray-400">
				<summary class="cursor-pointer text-center">{m.auth_error_details()}</summary>
				<p class="mt-2 break-words">
					{exchangeError}{data.description ? `: ${data.description}` : ''}
				</p>
			</details>
			<button
				type="button"
				onclick={startLogin}
				class="w-full rounded-full bg-black px-5 py-3.5 text-base font-semibold text-white">
				{m.auth_error_retry()}
			</button>
			<button
				type="button"
				onclick={() => replaceNavigation(Routes.Root, { resetDepth: true })}
				class="text-sm font-semibold text-gray-500">
				{m.auth_error_back()}
			</button>
		</div>
	{:else}
		<span class="text-sm text-gray-500">{m.auth_signing_in()}</span>
	{/if}
</div>
