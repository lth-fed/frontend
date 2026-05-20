import type { Guild } from '$lib/types/guild';

export const session = $state<{
	guild: Guild | null;
	accessToken: string | null;
	ready: boolean;
}>({
	guild: null,
	accessToken: null,
	ready: false
});
