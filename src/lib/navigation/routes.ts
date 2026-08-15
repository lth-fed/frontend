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

	/** Component gallery (development tool) */
	static DemoComponents: Pathname = '/demo/components/';

	/** Main tabs — reached via replaceNavigation, all at navDepth 0 */
	static Home: Pathname = '/home/';
	static Links: Pathname = '/links/';
	static Profile: Pathname = '/profile/';
	static Settings: Pathname = '/settings/';

	/** Settings sub-pages */
	static About: Pathname = '/settings/about/';
	static Filters: Pathname = '/settings/filters/';
	static Verify: Pathname = '/verify/';
	static Group = (id: string): Pathname => `/group/${id}/`;

	/** Activity sub-pages */
	static Activity = (slug: string): Pathname => `/activity/${slug}/`;
	static ActivityTickets = (slug: string): Pathname => `/activity/${slug}/tickets/`;
}

export default Routes;
