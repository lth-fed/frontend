import createClient, { type Client, type ClientOptions } from 'openapi-fetch';
import { authenticatedFetch } from 'auth-lib';
import { noteServerDate } from './serverClock';

import type { paths as AuthPaths } from './generated/auth';
import type { paths as ApiPaths } from './generated/api';

/**
 * Base URLs per environment. Both backends ship CORS allowing the dev
 * frontend origin, so browser calls go direct — no proxy hop. The vite
 * proxy stays in `vite.config.ts` only to route the server-callback URL
 * past fed-auth's same-authority check (see `lib/auth/bootstrap.ts`).
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

	noteServerDate(res.headers['Date'] ?? res.headers['date']);

	return new Response(
		toBodyText(res.data, res.headers['Content-Type'] ?? res.headers['content-type'] ?? ''),
		{
			status: res.status,
			headers: res.headers as Record<string, string>
		}
	);
}

/**
 * Reconstruct a body string from CapacitorHttp's `data`. Its web layer
 * auto-parses JSON responses, so a bare JSON string body (e.g. poem
 * enums like `"Reserved"`) arrives unquoted — re-encode it, or the
 * downstream JSON.parse fails. Strings that already parse as JSON (or
 * non-JSON content types) pass through untouched.
 */
function toBodyText(data: unknown, contentType: string): string | null {
	if (data == null) return null;
	if (typeof data !== 'string') return JSON.stringify(data);
	if (!contentType.includes('json')) return data;
	try {
		JSON.parse(data);
		return data;
	} catch {
		return JSON.stringify(data);
	}
}

/**
 * fetch-compatible wrapper that attaches a bearer token from auth-lib
 * (and transparently refreshes it on expiry). The network call goes
 * through CapacitorHttp so cookies (refresh token) are shared with the
 * native auth flow — SvelteKit's `load` fetch is deliberately not part
 * of the transport.
 */
export function withAuth(): (input: Request) => Promise<Response> {
	return fetchViaCapacitor;
}

export function makeAuth(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<AuthPaths> {
	return createClient<AuthPaths>({ baseUrl: AUTH_BASE, ...opts });
}

/** Build a client for the main app API. The bearer token is attached
 *  (and refreshed) automatically. */
export function makeApi(opts: Omit<ClientOptions, 'baseUrl'> = {}): Client<ApiPaths> {
	return createClient<ApiPaths>({ ...opts, baseUrl: API_BASE, fetch: withAuth() });
}

/** Default clients. `api` already wraps the transport with auth-lib. */
export const auth = makeAuth();
export const api = makeApi();
