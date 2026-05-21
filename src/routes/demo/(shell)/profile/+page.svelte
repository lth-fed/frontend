<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import { guilds } from '$lib/data/guilds';
	import { logout } from '$lib/auth/logout';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const profile = $derived(data.profile);

	const initials = $derived(
		profile.name
			.split(/\s+/)
			.map((s) => s.charAt(0).toUpperCase())
			.slice(0, 2)
			.join('')
	);

	async function handleSignOut() {
		await logout();
	}
</script>

<div class="flex w-full flex-col gap-3.75 px-4">
	<div
		class="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
	>
		<Avatar {initials} size="lg" />
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<h2 class="text-[20px] leading-tight font-semibold text-guild-on-surface">
				{profile.name}
			</h2>
			<p class="text-sm text-gray-600">
				<span class="font-medium">{m.profile_student_id_label()}:</span>
				{profile.studentId}
			</p>
			<p class="text-sm text-gray-600">
				<span class="font-medium">{m.profile_guild_label()}:</span>
				{guilds[profile.section].name}
			</p>
		</div>
	</div>

	<button
		type="button"
		onclick={handleSignOut}
		class="mt-3 w-full rounded-3xl border border-gray-100 bg-white p-4 text-center text-[16px] font-semibold text-red-600 shadow-[0_4px_10px_color-mix(in_srgb,rgb(0_0_0)_6%,transparent)]"
	>
		{m.profile_sign_out()}
	</button>
</div>
