import { browser } from '$app/environment';
import { invalidate as rerunLoads } from '$app/navigation';
import { navigationSettled } from '$lib/navigation/stackNavigation';

/**
 * Session-scoped stale-while-revalidate cache between `load` functions
 * and the resource wrappers (spec §3). Navigations render instantly
 * from cache; stale entries refresh in the background and, when the
 * data actually changed, re-run the mounted loads via SvelteKit's
 * `invalidate()` — components keep the plain `data` prop contract.
 *
 * Loads that read through `cached()` must pass their `depends` so the
 * page subscribes to `app:cache:{key}`; the `cached*` helpers in each
 * resource wrapper handle this.
 */

type CacheEntry = {
	value: unknown;
	fetchedAt: number;
	inflight: Promise<unknown> | null;
};

const store = new Map<string, CacheEntry>();
const PERSISTENT_PREFIX = 'tappen-api-cache:';

const dep = (key: string) => `app:cache:${key}` as const;

/** Re-run the mounted loads depending on `key` — once no navigation is pending, since SvelteKit
 *  drops a navigation that an `invalidate()` overtakes (see `navigationSettled`). */
function rerunDependentLoads(key: string): void {
	void navigationSettled().then(() => rerunLoads(dep(key)));
}

/** Serialized-form change detection; our values are JSON-shaped
 *  (Dates serialize stably to ISO strings). */
function changed(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) !== JSON.stringify(b);
}

function revalidate<T>(key: string, entry: CacheEntry, fetcher: () => Promise<T>): void {
	entry.inflight ??= fetcher()
		.then((fresh) => {
			const wasChanged = changed(entry.value, fresh);
			entry.value = fresh;
			entry.fetchedAt = Date.now();
			if (wasChanged && browser) rerunDependentLoads(key);
			return fresh;
		})
		.catch((err: unknown) => {
			// Keep serving stale data; a later navigation or invalidation
			// will retry. Cold-path errors propagate in `cached` instead.
			console.warn(`cache revalidation failed for ${key}`, err);
			return entry.value;
		})
		.finally(() => {
			entry.inflight = null;
		}) as Promise<unknown>;
}

/**
 * Read `key` through the cache. Fresh hits return immediately; stale
 * hits return the old value and refresh in the background; cold misses
 * await the fetch (errors propagate to the caller / error page).
 */
export async function cached<T>(
	key: string,
	ttlMs: number,
	fetcher: () => Promise<T>,
	depends?: (dep: `app:cache:${string}`) => void
): Promise<T> {
	depends?.(dep(key));

	const entry = store.get(key);
	if (entry && entry.value !== undefined) {
		if (Date.now() - entry.fetchedAt >= ttlMs) revalidate(key, entry, fetcher);
		return entry.value as T;
	}

	if (entry?.inflight) return entry.inflight as Promise<T>;

	const cold: CacheEntry = { value: undefined, fetchedAt: 0, inflight: null };
	store.set(key, cold);
	cold.inflight = fetcher();
	try {
		const value = await cold.inflight;
		cold.value = value;
		cold.fetchedAt = Date.now();
		return value as T;
	} catch (err) {
		store.delete(key);
		throw err;
	} finally {
		cold.inflight = null;
	}
}

/**
 * Opt-in persistent variant for the small amount of user data that must
 * remain available offline. Persisted values are served immediately and
 * revalidated through the normal stale-while-revalidate path.
 */
export function cachedPersistent<T>(
	key: string,
	ttlMs: number,
	fetcher: () => Promise<T>,
	revive: (value: unknown) => T,
	depends?: (dep: `app:cache:${string}`) => void
): Promise<T> {
	const storageKey = `${PERSISTENT_PREFIX}${key}`;
	if (browser && !store.has(key)) {
		try {
			const raw = localStorage.getItem(storageKey);
			if (raw) {
				const saved = JSON.parse(raw) as { value: unknown; fetchedAt: number };
				store.set(key, {
					value: revive(saved.value),
					fetchedAt: saved.fetchedAt,
					inflight: null
				});
			}
		} catch {
			try {
				localStorage.removeItem(storageKey);
			} catch {
				// Storage is unavailable; continue with the memory cache.
			}
		}
	}

	const effectiveTtl = browser && !navigator.onLine ? Number.POSITIVE_INFINITY : ttlMs;
	return cached(
		key,
		effectiveTtl,
		async () => {
			const fresh = await fetcher();
			if (browser) {
				try {
					localStorage.setItem(storageKey, JSON.stringify({ value: fresh, fetchedAt: Date.now() }));
				} catch {
					// Storage can be unavailable or full; the memory cache still works.
				}
			}
			return fresh;
		},
		depends
	);
}

/** Cached value regardless of freshness (or `undefined`). */
export function peek<T>(key: string): T | undefined {
	return store.get(key)?.value as T | undefined;
}

/** Plant an always-stale placeholder (e.g. a brief record standing in
 *  for a detail fetch): `cached()` serves it instantly and refreshes
 *  in the background. No-op if the key already holds data. */
export function seed(key: string, value: unknown): void {
	if (store.get(key)?.value !== undefined) return;
	store.set(key, { value, fetchedAt: 0, inflight: null });
}

/** Mark keys stale and re-run any mounted loads that depend on them.
 *  Pages re-render instantly from the stale value while the refresh
 *  runs — used after mutations and on app resume. */
export function invalidate(...keys: string[]): void {
	for (const key of keys) {
		const entry = store.get(key);
		if (entry) entry.fetchedAt = 0;
		if (browser) rerunDependentLoads(key);
	}
}

/** `invalidate` for every cached key starting with `prefix`
 *  (e.g. `kinds:` after a purchase). */
export function invalidatePrefix(prefix: string): void {
	invalidate(...[...store.keys()].filter((key) => key.startsWith(prefix)));
}

/** Drop everything — called on logout so no data crosses sessions. */
export function clearCache(): void {
	store.clear();
	if (browser) {
		try {
			for (let index = localStorage.length - 1; index >= 0; index -= 1) {
				const key = localStorage.key(index);
				if (key?.startsWith(PERSISTENT_PREFIX)) localStorage.removeItem(key);
			}
		} catch {
			// Storage is unavailable; the in-memory session data is still cleared.
		}
	}
}
