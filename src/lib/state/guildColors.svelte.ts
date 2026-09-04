import { session } from './session.svelte';

/**
 * Reads the active guild's resolved CSS custom property as a hex/rgba string
 * suitable for passing into native plugin configs. The session theme access
 * makes this reactive — any $effect or $derived calling readGuildVar will
 * re-evaluate when the theme flips.
 */
export function readGuildVar(name: string): string {
	void session.themeGuild;
	if (typeof document === 'undefined') return '';
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
