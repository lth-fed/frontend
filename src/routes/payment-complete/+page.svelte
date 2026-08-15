<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { STRIPE_CALLBACK_CHANNEL } from '$lib/payment/stripeCallback';

	onMount(() => {
		const channel = new BroadcastChannel(STRIPE_CALLBACK_CHANNEL);
		// eslint-disable-next-line no-restricted-syntax -- the secure browser must report the exact callback URL
		channel.postMessage(window.location.href);
		channel.close();
		if (window.opener) window.close();
	});
</script>

<div class="grid min-h-screen place-items-center p-6 text-center">
	<p>{m.payment_return_to_app()}</p>
</div>
