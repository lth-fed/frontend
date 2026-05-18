import createClient, { type Client, type ClientOptions } from 'openapi-fetch'

import type { paths as AuthPaths } from './generated/auth'
import type { paths as TicketsPaths } from './generated/tickets'

/**
 * Base URLs per environment. In dev we hit the local poem servers directly;
 * in production both services live behind teknologappen.se.
 */
const dev = import.meta.env.DEV
const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://auth.teknologappen.se/api/v0'
const TICKETS_BASE = dev ? 'http://localhost:8000/v0' : 'https://api.teknologappen.se/v0'

/**
 * Build a service client. Pass `fetch` from SvelteKit's `load` / form actions
 * so cookies and SSR-aware fetching work; or pass `authenticatedFetch` from
 * `auth-lib` to attach the bearer token automatically.
 */
export function makeAuth(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<AuthPaths> {
	return createClient<AuthPaths>({ baseUrl: AUTH_BASE, ...opts })
}

export function makeTickets(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<TicketsPaths> {
	return createClient<TicketsPaths>({ baseUrl: TICKETS_BASE, ...opts })
}

/**
 * Default browser-side clients using the global `fetch`. Prefer the `make*`
 * factories inside SvelteKit `load` functions so the framework can hand you a
 * server-aware fetch.
 */
export const auth = makeAuth()
export const tickets = makeTickets()
