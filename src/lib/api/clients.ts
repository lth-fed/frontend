import createClient, { type Client, type ClientOptions } from 'openapi-fetch';
import { authenticatedFetch } from 'auth-lib';

import type { paths as AuthPaths } from './generated/auth';
import type { paths as ApiPaths } from './generated/tickets';

/**
 * Base URLs per environment. In dev we hit the local poem servers directly;
 * in production both services live behind teknologappen.se.
 */
const dev = import.meta.env.DEV;
const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0';
const API_BASE = dev ? 'http://localhost:8000/v0' : 'https://api.teknologappen.se/v0';

type AllowedMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function fetchViaCapacitor(input: Request): Promise<Response> {
	const headers: Record<string, string> = {};
	input.headers.forEach((v, k) => {
		headers[k] = v;
	});

	const method = input.method.toUpperCase() as AllowedMethod;
	let data: unknown;
	if (method !== 'GET') {
		const text = await input.text();
		if (text) {
			try {
				data = JSON.parse(text);
			} catch {
				data = text;
			}
		}
	}

	const res = await authenticatedFetch(
		{ url: input.url, method, headers, data, responseType: 'text' },
		() => {}
	);

	const body =
		res.data == null ? null : typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
	return new Response(body, {
		status: res.status,
		headers: res.headers as Record<string, string>
	});
}

/**
 * fetch-compatible wrapper that attaches a bearer token from auth-lib
 * (and transparently refreshes it on expiry). The network call goes through
 * CapacitorHttp so cookies (refresh token) are shared with the native auth
 * flow; the `baseFetch` parameter is kept for call-site compatibility but
 * is unused.
 */
export function withAuth(_baseFetch: typeof fetch = fetch): (input: Request) => Promise<Response> {
	return fetchViaCapacitor;
}

export function makeAuth(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<AuthPaths> {
	return createClient<AuthPaths>({ baseUrl: AUTH_BASE, ...opts });
}

/**
 * Build a client for the main app API. The bearer token is attached
 * automatically; pass `fetch` to override the underlying transport
 * (e.g. SvelteKit's `load` fetch). The auth wrapping is always applied.
 */
export function makeApi(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<ApiPaths> {
	const baseFetch = opts.fetch as typeof fetch | undefined;
	return createClient<ApiPaths>({ ...opts, baseUrl: API_BASE, fetch: withAuth(baseFetch) });
}

/**
 * Default browser-side clients. `api` already wraps fetch with auth-lib;
 * use `make*` inside SvelteKit `load` functions if you need to thread the
 * framework-provided fetch through.
 */
export const auth = makeAuth();
export const api = makeApi();

/**
 * Shared options shape for the resource-level api wrappers in
 * `lib/api/*.ts`. Carries the framework `fetch` so SvelteKit's
 * preload/SSR machinery applies when called from a load function;
 * extend per-resource if a call needs more options.
 */
export type ApiCallOpts = {
	fetch?: typeof globalThis.fetch;
};
