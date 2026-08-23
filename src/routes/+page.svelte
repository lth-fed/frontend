<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { replaceNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { session } from '$lib/state/session.svelte';

	// The root layout owns auth restoration. Do not read the native Preferences
	// store again from a route load: on iOS that second bridge call could stall
	// while the layout had already established a session, leaving only the app
	// background visible. React to the in-memory session instead so Svelte can
	// render this fallback throughout the transition to Home.
	$effect(() => {
		if (session.accessToken) void replaceNavigation(Routes.Home, { resetDepth: true });
	});
</script>

<div class="grid min-h-screen place-items-center text-sm text-gray-500">
	{m.auth_signing_in()}
</div>
