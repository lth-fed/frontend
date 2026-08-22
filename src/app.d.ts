// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { ApiErrorKind } from '$lib/api/errors';

declare global {
	const __GIT_REVISION__: string;

	namespace App {
		interface Error {
			message: string;
			/** Set by `apiError()` (see `$lib/api/errors`). `+error.svelte` can
			 *  branch on this for kind-specific UX (banner, retry, etc.). */
			kind?: ApiErrorKind;
		}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			navDepth?: number;
			navTransition?: 'forward' | 'back' | 'root';
			returnTo?: string;
		}
		// interface Platform {}
	}
}

export {};
