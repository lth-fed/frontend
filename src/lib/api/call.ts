import { apiError, extractErrorMessage } from './errors';

/**
 * Global demo-mode flag. When `true`, every resource wrapper in
 * `lib/api/*.ts` returns local mock data instead of hitting the
 * backend. Used for App Store review builds and for letting curious
 * users explore the app without a real account; the entry point that
 * flips this is intentionally tucked away in settings rather than
 * advertised in primary UI.
 */
export const DEMO_MODE = false;

type FetchResult<T> = {
	data?: T;
	error?: unknown;
	response: Response;
};

/**
 * Run an openapi-fetch call and translate failure into a SvelteKit
 * HTTP error via `apiError()`. Wraps the per-resource call bodies in
 * `lib/api/*.ts`.
 *
 * - 2xx → returns `data`
 * - fetch-throws (offline / DNS / connection refused) → network
 * - 401 → unauthorized
 * - 404 → not-found
 * - 5xx → server
 * - any other non-2xx → unknown
 *
 * The response body (when present) is run through `extractErrorMessage`
 * and threaded into `apiError` as the message; falls back to the kind
 * label when no string can be pulled out.
 */
export async function unwrap<T>(call: () => Promise<FetchResult<T>>): Promise<T> {
	let result: FetchResult<T>;
	try {
		result = await call();
	} catch (e) {
		console.error("network error:", e)
		apiError('network');
	}

	if (result.response.ok) return result.data as T;

	const status = result.response.status;
	const message = extractErrorMessage(result.error);
	if (status === 401) apiError('unauthorized', message);
	if (status === 404) apiError('not-found', message);
	if (status >= 500) apiError('server', message);
	apiError('unknown', message);
}
