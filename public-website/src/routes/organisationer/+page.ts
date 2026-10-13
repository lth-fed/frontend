// The pitch page is Swedish-only by design (see src/lib/tappen-content.ts).
// Paraglide prepends the base locale ("en") to every URL, so strip the prefix
// for this route to keep it reachable at /organisationer.
export const ssr = false;
export const prerender = true;
