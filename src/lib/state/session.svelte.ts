import type { Guild } from '$lib/types/guild';

export const session = $state<{ guild: Guild | null }>({
	guild: null
});
