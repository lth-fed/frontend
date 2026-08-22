<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { onMount } from 'svelte';

	const APP_STORE_URL = 'https://apps.apple.com/se/app/tappen/id6772353068';
	const WEB_APP_URL = 'https://app.teknologappen.se';
	const IOS_REDIRECTED_KEY = 'tappen-app-store-redirected';

	type Client = 'ios' | 'android' | 'desktop';

	let client = $state<Client>('desktop');
	let ready = $state(false);

	onMount(() => {
		client = detectClient();
		ready = true;

		if (client === 'ios' && sessionStorage.getItem(IOS_REDIRECTED_KEY) !== 'true') {
			sessionStorage.setItem(IOS_REDIRECTED_KEY, 'true');
			requestAnimationFrame(() => window.location.assign(APP_STORE_URL));
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
			<p class="install-lead">{m.install_ios_opening()}</p>
		{:else}
			<p class="install-lead">
				{client === 'android' ? m.install_android_unavailable() : m.install_description()}
			</p>
			<div class="install-actions">
				<a class="button primary" href={APP_STORE_URL}>{m.install_app_store()}</a>
				<div class="disabled-store-option">
					<span class="button secondary disabled" aria-disabled="true">
						{m.install_play_store()}
					</span>
					<small>{m.install_play_store_soon()}</small>
				</div>
				<a class="button secondary" href={WEB_APP_URL}>{m.install_web()}</a>
			</div>
		{/if}
	</section>
</main>
