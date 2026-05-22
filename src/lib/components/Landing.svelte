<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { startLogin } from '$lib/auth/bootstrap';
</script>

<div class="grid min-h-screen place-items-center px-6">
	<div class="flex w-full max-w-sm flex-col items-center gap-8 text-center">
		<h1 class="text-2xl font-semibold text-gray-900">{m.auth_landing_title()}</h1>
		<button
			type="button"
			onclick={startLogin}
			class="w-full rounded-full bg-black px-5 py-3.5 text-base font-semibold text-white"
		>
			{m.auth_log_in()}
		</button>
	</div>
</div>
