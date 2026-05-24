import type { Guild } from '$lib/types/guild';

export const session = $state<{
	guild: Guild | null;
	/** Backend user id (e.g. `test:si1234mc-s` or `mail:foo@bar.com`).
	 *  Set during auth bootstrap; consumed by display helpers like
	 *  `initialsFromStilId`. */
	userId: string | null;
	accessToken: string | null;
	isProcessing: boolean;
}>({
	guild: null,
	userId: null,
	accessToken: null,
	isProcessing: false
});
