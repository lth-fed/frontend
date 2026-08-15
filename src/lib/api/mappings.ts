import { baseLocale, getLocale, locales } from '$lib/paraglide/runtime';
import type { Guild } from '$lib/types/guild';
import type { components } from './generated/api';

type RawLocation = components['schemas']['Location'];

/** Every location representation supported by minilith. Fields may be
 * combined (for example a named venue with coordinates and directions). */
export type Location = {
	name?: string;
	directions?: string;
	coordinates?: { north: number; east: number };
	url?: string;
};

/**
 * Backend sends localized strings as `{ "en": "...", "sv": "..." }`. The
 * picker tries the active paraglide locale first, then falls back to the
 * project base locale, then to any other key present, and finally to the
 * empty string. The last step shouldn't normally fire — if it does, the
 * backend shipped a string with no usable locales and we want it to
 * degrade quietly rather than throw mid-render.
 */
export function pickI18n(record: Readonly<Record<string, string>> | undefined): string {
	if (!record) return '';
	const current = getLocale();
	if (record[current]) return record[current];
	if (record[baseLocale]) return record[baseLocale];
	for (const l of locales) if (record[l]) return record[l];
	for (const v of Object.values(record)) if (v) return v;
	return '';
}

const GUILDS: ReadonlySet<Guild> = new Set(['f', 'e', 'm', 'v', 'a', 'k', 'd', 'ing', 'w', 'i']);

/**
 * Extract a guild code from a backend ltree path like `"tlth.f"` or
 * `"tlth.e.styrelsen"`. Returns `undefined` when the second segment
 * isn't one of the known codes (root `tlth`, unrelated subtrees, etc.)
 * so consumers can fall back to the default un-themed look instead of
 * crashing.
 */
export function guildFromPath(path: string): Guild | undefined {
	const segments = path.split('.');
	const code = segments[1];
	if (code && (GUILDS as ReadonlySet<string>).has(code)) return code as Guild;
	return undefined;
}

/** Backend dates are ISO 8601 strings; component code wants `Date`. */
export function parseDate(iso: string): Date {
	return new Date(iso);
}

export function mapLocation(location: RawLocation): Location {
	return {
		name: pickI18n(location.name) || undefined,
		directions: pickI18n(location.directions) || undefined,
		coordinates: location.coordinate_wgs84
			? {
					north: location.coordinate_wgs84.north,
					east: location.coordinate_wgs84.east
				}
			: undefined,
		url: location.url || undefined
	};
}

/** Human-readable fallback for cards and ticket faces. */
export function locationLabel(location: Location): string {
	if (location.name) return location.name;
	if (location.directions) return location.directions;
	if (location.url) {
		try {
			return new URL(location.url).hostname.replace(/^www\./, '');
		} catch {
			return location.url;
		}
	}
	if (location.coordinates) {
		return `${location.coordinates.north.toFixed(5)}, ${location.coordinates.east.toFixed(5)}`;
	}
	return '';
}
