<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { APP_STORE_URL, PLAY_STORE_URL } from '$lib/store-links';
	import { onMount } from 'svelte';

	const WEB_APP_URL = 'https://app.teknologappen.se';
	const STORE_REDIRECTED_KEY = 'tappen-store-redirected';

	type Client = 'ios' | 'android' | 'desktop';

	let client = $state<Client>('desktop');
	let ready = $state(false);

	onMount(() => {
		client = detectClient();
		ready = true;

		const storeUrl =
			client === 'ios' ? APP_STORE_URL : client === 'android' ? PLAY_STORE_URL : null;
		if (storeUrl && sessionStorage.getItem(STORE_REDIRECTED_KEY) !== storeUrl) {
			sessionStorage.setItem(STORE_REDIRECTED_KEY, storeUrl);
			requestAnimationFrame(() => window.location.assign(storeUrl));
		}
	});

	function detectClient(): Client {
		const userAgent = navigator.userAgent;
		if (/Android/i.test(userAgent)) return 'android';
		if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
		// iPadOS can identify itself as desktop Safari.
		if (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) return 'ios';
		return 'desktop';
	}
</script>

<svelte:head>
	<title>{m.install_title()} — Teknologappen</title>
	<meta name="description" content={m.install_description()} />
</svelte:head>

<main id="main" class="install-page">
	<section class="install-card">
		<p class="eyebrow">Teknologappen</p>
		<h1>{m.install_title()}</h1>
		{#if !ready}
			<p class="install-lead">{m.install_store_opening()}</p>
		{:else}
			<p class="install-lead">{m.install_description()}</p>
			<div class="install-actions">
				<a class="button primary" href={APP_STORE_URL}>{m.install_app_store()}</a>
				<a class="button primary" href={PLAY_STORE_URL}>{m.install_play_store()}</a>
				<a class="button secondary" href={WEB_APP_URL}>{m.install_web()}</a>
			</div>
		{/if}
	</section>
</main>
