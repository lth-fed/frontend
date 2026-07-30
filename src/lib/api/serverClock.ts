/**
 * Server-clock offset (spec §4.2). All purchase-flow time math — entry
 * gates, release wakes, countdowns — uses `serverNow()` instead of the
 * device clock, so a skewed phone can't e.g. enter the release queue
 * early enough for its spot to purge before release.
 *
 * The offset is estimated from the `Date` response header of every
 * minilith response (second granularity + network latency ≈ ±2 s,
 * absorbed by the flow's one-minute safety margins).
 */

let offsetMs = 0;

/** Feed a response's `Date` header. Called by the API transport. */
export function noteServerDate(dateHeader: string | null | undefined): void {
	if (!dateHeader) return;
	const serverTime = Date.parse(dateHeader);
	if (!Number.isNaN(serverTime)) offsetMs = serverTime - Date.now();
}

/** Best estimate of the backend's current time. */
export function serverNow(): Date {
	return new Date(Date.now() + offsetMs);
}
