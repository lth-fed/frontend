import { api } from './clients';
import { DEMO_MODE } from './call';
import type { ApiCallOpts } from './clients';

/**
 * Coarse signal for offline / degraded backends. The endpoint returns
 * plain text 200/503; this wrapper smooths both fetch-throws and 5xx
 * into a `'down'` so UI can show a banner without unwinding via
 * `apiError`. We deliberately swap on a *successful* 200 only.
 */
export async function healthcheck(opts: ApiCallOpts = {}): Promise<'ok' | 'down'> {
	if (DEMO_MODE) return 'ok';
	try {
		const { response } = await api.GET('/healthcheck', {});
		return response.ok ? 'ok' : 'down';
	} catch {
		return 'down';
	}
}
