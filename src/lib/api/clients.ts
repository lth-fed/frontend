import createClient, { type Client, type ClientOptions } from 'openapi-fetch';
import { authenticatedFetch } from 'auth-lib';
import { noteServerTime } from './serverClock';

import type { paths as AuthPaths } from './generated/auth';
import type { paths as ApiPaths } from './generated/api';

/**
 * Base URLs per environment. Both backends ship CORS allowing the dev
 * frontend origin, so browser calls go direct — no proxy hop. The vite
 * proxy stays in `vite.config.ts` only to route the server-callback URL
 * past fed-auth's same-authority check (see `lib/auth/bootstrap.ts`).
 */
const dev = import.meta.env.DEV;
const AUTH_BASE = dev ? 'http://localhost:8001/api/v0' : 'https://api.auth.teknologappen.se/api/v0';
const API_BASE = dev ? 'http://localhost:8000/v0' : 'https://api.teknologappen.se/v0';

type AllowedMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function fetchViaCapacitor(input: Request): Promise<Response> {
	const headers: Record<string, string> = {};
	input.headers.forEach((v, k) => {
		headers[k] = v;
	});

	const method = input.method.toUpperCase() as AllowedMethod;
	const responseType = input.headers.get('accept')?.includes('application/octet-stream')
		? 'arraybuffer'
		: 'text';
	let data: unknown;
	if (method !== 'GET') {
		const text = await input.text();
		// `Request.body` is already serialized by openapi-fetch. Keep it verbatim:
		// Capacitor treats string data as a complete request body, so parsing a JSON
		// string such as `"sv"` here would make it send the invalid bare value `sv`.
		if (text) data = text;
	}

	const res = await authenticatedFetch(
		{ url: input.url, method, headers, data, responseType },
		() => {}
	);

	const contentType = res.headers['Content-Type'] ?? res.headers['content-type'] ?? '';
	return new Response(toResponseBody(res.data, contentType, res.status, responseType), {
		status: res.status,
		headers: res.headers as Record<string, string>
	});
}

function toResponseBody(
	data: unknown,
	contentType: string,
	status: number,
	responseType: 'arraybuffer' | 'text'
): BodyInit | null {
	if (responseType === 'text' || contentType.includes('json') || status < 200 || status >= 300) {
		return toBodyText(data, contentType);
	}
	if (typeof data !== 'string') return toBodyText(data, contentType);

	const binary = atob(data);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes;
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

/** Refresh the persisted server-clock offset with an explicit, millisecond-precision API value. */
export async function syncServerClock(): Promise<void> {
	const started = Date.now();
	const { data, response } = await api.GET('/time', {});
	const ended = Date.now();
	if (response.ok && data) noteServerTime(data.utc, started, ended);
}
