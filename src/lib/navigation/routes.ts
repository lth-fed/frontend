import type { Pathname } from '$app/types';

/**
 * All in-app routes, gathered in one place. Static fields are concrete
 * pathname constants; functions return concrete paths for dynamic routes.
 * Values are typed as `Pathname`, so they slot into `resolve()` and the
 * navigation helpers without casts.
 */
class Routes {
	/** Entry / auth */
	static Root: Pathname = '/';
	static AuthCallback: Pathname = '/auth/callback/';

	/** Demo index (development links) */
	static Demo: Pathname = '/demo/';
	static DemoComponents: Pathname = '/demo/components/';

	/** Main tabs — reached via replaceNavigation, all at navDepth 0 */
	static Home: Pathname = '/demo/homepage/';
	static Links: Pathname = '/demo/links/';
	static Profile: Pathname = '/demo/profile/';
	static Settings: Pathname = '/demo/settings/';

	/** Activity sub-pages */
	static Activity = (slug: string): Pathname => `/demo/activity/${slug}/`;
	static ActivityTickets = (slug: string): Pathname => `/demo/activity/${slug}/tickets/`;
}

export default Routes;
