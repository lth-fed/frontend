import {
	baseLocale,
	getLocale as getRawLocale,
	getTextDirection,
	overwriteGetLocale,
	overwriteSetLocale,
	setLocale as setRawLocale
} from '$lib/paraglide/runtime';
import type { Locale } from '$lib/paraglide/runtime';

// Capture originals before overwriting (imported bindings are live).
const _getRawLocale = getRawLocale;
const _setRawLocale = setRawLocale;

// Reactive locale signal for Svelte 5. Overwrites paraglide's get/set so
// `m.*()` calls (which read getLocale() synchronously) become reactive
// without requiring `window.location.reload()`.
let _locale: Locale = $state<Locale>(getInitialLocale());
let _localeInitialized = false;

function getInitialLocale(): Locale {
	try {
		const raw = _getRawLocale();
		return (raw as Locale) ?? (baseLocale as Locale);
	} catch {
		return baseLocale as Locale;
	}
}

function syncLocaleFromCookie(): void {
	if (_localeInitialized) return;
	if (typeof document === 'undefined') return;
	try {
		const raw = _getRawLocale();
		if (raw && raw !== _locale) _locale = raw as Locale;
		_localeInitialized = true;
	} catch {
		// ignore
	}
}

// Defer sync until after DOM is ready to ensure cookie is available on
// Capacitor cold starts (document.cookie may be empty at import time).
if (typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', syncLocaleFromCookie, { once: true });
	} else {
		queueMicrotask(syncLocaleFromCookie);
	}
}

// Make every future `getLocale()` read the reactive signal.
// Lazily sync on first call in case the initial read happened too early.
overwriteGetLocale(() => {
	syncLocaleFromCookie();
	return _locale;
});

// Wrap `setLocale` to keep the reactive signal in sync, update
// document lang/dir, and default to `reload:false` to avoid the
// white flash from `window.location.reload()` on Capacitor.
overwriteSetLocale(async (newLocale: Locale, options?: { reload?: boolean }) => {
	const reload = options?.reload ?? false;
	// Call original implementation with reload forced off; it handles
	// cookie + globalVariable writes + cache clearing.
	await _setRawLocale(newLocale, { ...options, reload });
	_locale = newLocale;
	if (typeof document !== 'undefined') {
		try {
			document.documentElement.lang = newLocale;
			document.documentElement.dir = getTextDirection(newLocale);
		} catch {
			// ignore during prerender
		}
	}
});

/** Reactive accessor — reading `locale.current` inside a Svelte
 *  `$derived`/`$effect`/template registers a dependency. */
export const locale = {
	get current(): Locale {
		return _locale;
	}
};

/** Programmatic setter that defaults to `reload:false`. */
export async function setLocale(newLocale: Locale, options?: { reload?: boolean }): Promise<void> {
	const reload = options?.reload ?? false;
	await _setRawLocale(newLocale, { ...options, reload });
	_locale = newLocale;
	if (typeof document !== 'undefined') {
		try {
			document.documentElement.lang = newLocale;
			document.documentElement.dir = getTextDirection(newLocale);
		} catch {
			// ignore
		}
	}
}

export { getTextDirection };
