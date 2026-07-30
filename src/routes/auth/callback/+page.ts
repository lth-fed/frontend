import { redirect } from '@sveltejs/kit';
import { finishWebLogin } from '$lib/auth/bootstrap';
import type { PageLoad } from './$types';

export const prerender = true;

/** The auth server lands here with either `?code=…&state=…` (success) or
 *  `?error=…&error_description=…` (krav §2–3's "an error is shown back in
 *  the app" path). On success we exchange the code and move on; otherwise
 *  the page renders the error with a retry. */
export const load: PageLoad = async ({ url }) => {
	const error = url.searchParams.get('error');
	if (error !== null) {
		return { error, description: url.searchParams.get('error_description') };
	}
	if (await finishWebLogin()) {
		redirect(303, '/');
	}
	return { error: 'exchange_failed', description: null };
};
