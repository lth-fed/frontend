import type { Guild } from '$lib/types/guild';

export const session = $state<{
	guild: Guild | null;
	/** Visual theme only; null keeps the neutral app palette. */
	themeGuild: Guild | null;
	/** Backend user id (e.g. `test:si1234mc-s` or `mail:foo@bar.com`).
	 *  Set during auth bootstrap; consumed by display helpers like
	 *  `initialsFromStilId`. */
	userId: string | null;
	accessToken: string | null;
	isProcessing: boolean;
	/** Why the last login attempt ended without a session. `cancelled` =
	 *  the user backed out (closed the in-app browser); `failed` = the
	 *  auth server reported an error or the code exchange failed.
	 *  Rendered by `Landing`; cleared when a new attempt starts. */
	loginError: 'cancelled' | 'failed' | null;
}>({
	guild: null,
	themeGuild: null,
	userId: null,
	accessToken: null,
	isProcessing: false,
	loginError: null
});
