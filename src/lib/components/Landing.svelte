<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { startExternalValidationLogin, startLogin } from '$lib/auth/bootstrap';
	import { session } from '$lib/state/session.svelte';

	let welcomeClickCount = 0;

	function handleWelcomeClick(): void {
		welcomeClickCount += 1;
		if (welcomeClickCount < 5) return;

		welcomeClickCount = 0;
		void startExternalValidationLogin();
	}
</script>

<div class="grid min-h-screen place-items-center px-6">
	<div class="flex w-full max-w-sm flex-col items-center gap-8 text-center">
		<h1 class="text-2xl font-semibold text-gray-900">
			<button
				type="button"
				onclick={handleWelcomeClick}
				class="cursor-default appearance-none border-0 bg-transparent p-0 font-[inherit] text-[inherit]">
				{m.auth_landing_title()}
			</button>
		</h1>
		{#if session.loginError}
			<p class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
				{session.loginError === 'cancelled' ? m.auth_error_cancelled() : m.auth_error_failed()}
			</p>
		{/if}
		<button
			type="button"
			onclick={startLogin}
			class="w-full rounded-full bg-black px-5 py-3.5 text-base font-semibold text-white">
			{session.loginError ? m.auth_error_retry() : m.auth_log_in()}
		</button>
	</div>
</div>
