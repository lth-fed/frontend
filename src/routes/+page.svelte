<script lang="ts">
	import { replaceNavigation } from '$lib/navigation/stackNavigation';
	import Routes from '$lib/navigation/routes';
	import { session } from '$lib/state/session.svelte';

	// The root layout owns auth restoration and only renders this page's `children()`
	// once `session.accessToken` is set (Landing/the sign-in fallback stand in for it
	// otherwise) — so by the time this mounts, the session is already established.
	// Redirect straight to Home with no visible intermediate screen: Home's own load
	// reads through the persistent cache, so the swap is effectively instant.
	$effect(() => {
		if (session.accessToken) void replaceNavigation(Routes.Home, { resetDepth: true });
	});
</script>
