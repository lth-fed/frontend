/**
 * Server-clock offset (spec §4.2). All purchase-flow time math — entry
 * gates, release wakes, countdowns — uses `serverNow()` instead of the
 * device clock, so a skewed phone can't e.g. enter the release queue
 * early enough for its spot to purge before release.
 *
 * The offset is measured through `/time` against the midpoint of the
 * request. Persisting it avoids falling back to a skewed device clock
 * while the next app-start measurement is in flight.
 */

const OFFSET_KEY = 'tappen-server-clock-offset-ms';

let offsetMs = readOffset();

function readOffset(): number {
	try {
		const stored = Number(localStorage.getItem(OFFSET_KEY));
		return Number.isFinite(stored) ? stored : 0;
	} catch {
		return 0;
	}
}

/** Record a `/time` response using half the round trip as estimated latency. */
export function noteServerTime(
	serverUtc: string,
	requestStarted: number,
	requestEnded: number
): void {
	const serverTime = Date.parse(serverUtc);
	if (Number.isNaN(serverTime)) return;
	offsetMs = serverTime - (requestStarted + requestEnded) / 2;
	try {
		localStorage.setItem(OFFSET_KEY, String(offsetMs));
	} catch {
		// Storage may be blocked; the in-memory measurement still applies.
	}
}

/** Best estimate of the backend's current time. */
export function serverNow(): Date {
	return new Date(Date.now() + offsetMs);
}
