import createClient, { type Client, type ClientOptions } from 'openapi-fetch'
import { authenticatedFetch } from 'auth-lib'

import type { paths as AuthPaths } from './generated/auth'
import type { paths as ApiPaths } from './generated/tickets'

/**
 * Base URLs per environment. In dev we hit the local poem servers directly;
 * in production both services live behind teknologappen.se.
 */
const dev = import.meta.env.DEV
const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0'
const API_BASE = dev ? 'http://localhost:8000/v0' : 'https://api.teknologappen.se/v0'

/**
 * fetch-compatible wrapper that attaches a bearer token from auth-lib
 * (and transparently refreshes it on expiry). Compose around any base
 * fetch — typically the global `fetch`, or SvelteKit's `load` fetch when
 * threading through framework-aware fetching.
 */
export function withAuth(baseFetch: typeof fetch = fetch): (input: Request) => Promise<Response> {
	return (input) => authenticatedFetch(baseFetch, () => {}, input)
}

export function makeAuth(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<AuthPaths> {
	return createClient<AuthPaths>({ baseUrl: AUTH_BASE, ...opts })
}

/**
 * Build a client for the main app API. The bearer token is attached
 * automatically; pass `fetch` to override the underlying transport
 * (e.g. SvelteKit's `load` fetch). The auth wrapping is always applied.
 */
export function makeApi(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<ApiPaths> {
	const baseFetch = opts.fetch as typeof fetch | undefined
	return createClient<ApiPaths>({ ...opts, baseUrl: API_BASE, fetch: withAuth(baseFetch) })
}

/**
 * Default browser-side clients. `api` already wraps fetch with auth-lib;
 * use `make*` inside SvelteKit `load` functions if you need to thread the
 * framework-provided fetch through.
 */
export const auth = makeAuth()
export const api = makeApi()

/**
 * Shared options shape for the resource-level api wrappers in
 * `lib/api/*.ts`. Carries the framework `fetch` so SvelteKit's
 * preload/SSR machinery applies when called from a load function;
 * extend per-resource if a call needs more options.
 */
export type ApiCallOpts = {
	fetch?: typeof globalThis.fetch
};
