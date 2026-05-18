<script lang="ts">
	import { Bell } from '@lucide/svelte';
	import Avatar from './Avatar.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		initials: string;
		onAvatarClick?: () => void;
		onNotificationsClick?: () => void;
	}

	let { initials, onAvatarClick, onNotificationsClick }: Props = $props();
</script>

<header class="flex items-center justify-between bg-guild-surface px-6 py-4">
	<Avatar {initials} onclick={onAvatarClick} label={m.top_bar_account_label()} />

	<button type="button" aria-label={m.top_bar_notifications_label()} onclick={onNotificationsClick}>
		<Bell class="size-7 fill-guild-primary stroke-guild-ring" aria-hidden="true" />
	</button>
</header>
