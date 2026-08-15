<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	onMount(() => {
		if (window.opener) window.close();
	});
</script>

<div class="grid min-h-screen place-items-center p-6 text-center">
	<p>{m.payment_return_to_app()}</p>
</div>
