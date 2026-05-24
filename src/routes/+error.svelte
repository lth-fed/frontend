<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { logout } from '$lib/auth/logout';
	import { session } from '$lib/state/session.svelte';
	import type { ApiErrorKind } from '$lib/api/errors';

	/**
	 * `apiError(kind, ...)` in `lib/api/errors.ts` stuffs a `kind` field
	 * onto `$page.error`, mirroring SvelteKit's HTTPError shape. Map it
	 * to a human message; fall back when something else throws.
	 */
	const kind = $derived((page.error as { kind?: ApiErrorKind } | null)?.kind);

	const description = $derived.by(() => {
		switch (kind) {
			case 'unauthorized':
				return m.error_status_unauthorized();
			case 'not-found':
				return m.error_status_not_found();
			case 'network':
				return m.error_status_network();
			case 'server':
				return m.error_status_server();
			default:
				return m.error_status_unknown();
		}
	});

	async function handleSignOut() {
		await logout();
	}

	function handleRetry() {
		location.reload();
	}
</script>

<div class="grid min-h-screen place-items-center px-6">
	<div class="flex w-full max-w-sm flex-col items-center gap-6 text-center">
		<h1 class="text-2xl font-semibold text-gray-900">{m.error_title()}</h1>
		<p class="text-base text-gray-600">{description}</p>

		<div class="flex w-full flex-col gap-3">
			<button
				type="button"
				onclick={handleRetry}
				class="w-full rounded-full bg-black px-5 py-3.5 text-base font-semibold text-white"
			>
				{m.error_try_again()}
			</button>
			{#if session.accessToken}
				<button
					type="button"
					onclick={handleSignOut}
					class="w-full rounded-full border border-gray-200 px-5 py-3.5 text-base font-semibold text-red-600"
				>
					{m.profile_sign_out()}
				</button>
			{/if}
		</div>
	</div>
</div>
