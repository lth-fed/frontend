import type { PageLoad } from './$types';

export const prerender = true;

/** Parse authorization errors synchronously. The code exchange runs after the page mounts so a
 * visible loading/error state exists even if the browser's token request stalls. */
export const load: PageLoad = ({ url }) => {
	const error = url.searchParams.get('error');
	if (error !== null) {
		return { error, description: url.searchParams.get('error_description') };
	}
	return { error: null, description: null };
};
