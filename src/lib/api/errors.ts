import { error } from '@sveltejs/kit';

export type ApiErrorKind = 'network' | 'unauthorized' | 'not-found' | 'server' | 'unknown';

const STATUS_FOR: Record<ApiErrorKind, number> = {
	network: 503,
	unauthorized: 401,
	'not-found': 404,
	server: 503,
	unknown: 500
};

/**
 * Throw a SvelteKit-recognized HTTP error with our `kind` discriminator
 * tucked into the body. The framework renders the correct status, and
 * `+error.svelte` can read `$page.error.kind` to branch UX (network
 * banner, sign-in prompt, etc.). Callers outside a load context can
 * still recognize the throw via `isHttpError` from `@sveltejs/kit`.
 */
export function apiError(kind: ApiErrorKind, message?: string): never {
	throw error(STATUS_FOR[kind], { message: message ?? kind, kind });
}

/**
 * Best-effort extraction of a human-readable message from a parsed
 * error body. Covers the shapes we expect to see in the wild:
 *
 * - plain text bodies (poem's default)
 * - RFC 7807 / Problem Details (`detail` / `title`)
 * - common ad-hoc JSON (`message` / `error`)
 *
 * Returns `undefined` if nothing string-ish was found, letting
 * `apiError` fall back to the `kind` label as the message. Extend the
 * key list once the backend declares its error shape.
 */
export function extractErrorMessage(body: unknown): string | undefined {
	if (typeof body === 'string') return body || undefined;
	if (body && typeof body === 'object') {
		for (const key of ['detail', 'message', 'error', 'title'] as const) {
			const v = (body as Record<string, unknown>)[key];
			if (typeof v === 'string' && v) return v;
		}
	}
	return undefined;
}
