import { getLocale } from '$lib/paraglide/runtime';
import { serverNow } from '$lib/api/serverClock';
import * as m from '$lib/paraglide/messages';

/** Compact form for list cards. Order/words follow current paraglide
 *  locale; first letter capitalized so it reads as the start of the
 *  card line. EN: "Mon, Apr 27". SV: "Mån. 27 apr.". */
export function formatCardDate(d: Date): string {
	const relative = relativeDay(d);
	if (relative) return relative;
	const locale = getLocale();
	const date = new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: yearIfNotCurrent(d)
	}).format(d);
	return `${capitalize(date)}`;
}

/** Verbose form for the detail head; first letter capitalized.
 *  EN: "Monday, 27 Apr". SV: "Måndag 27 apr.". */
export function formatDetailDate(d: Date): string {
	const relative = relativeDay(d);
	if (relative) return relative;
	return capitalize(
		new Intl.DateTimeFormat(getLocale(), {
			weekday: 'long',
			day: 'numeric',
			month: 'short',
			year: yearIfNotCurrent(d)
		}).format(d)
	);
}

function yearIfNotCurrent(d: Date): 'numeric' | undefined {
	return d.getFullYear() === serverNow().getFullYear() ? undefined : 'numeric';
}

/** Time range, including the end day for activities longer than 24 hours. */
export function formatTimeRange(start: Date, end: Date): string {
	const locale = getLocale();
	const endLabel =
		end.getTime() - start.getTime() > 24 * 60 * 60 * 1_000
			? `${formatDetailDate(end)} ${formatTime(end, locale)}`
			: formatTime(end, locale);
	return `${formatTime(start, locale)} - ${endLabel}`;
}

function formatTime(d: Date, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).format(d);
}

/** Card date + clock time, e.g. EN "Thu, Jul 30 14:00" / SV
 *  "Tors. 30 juli 14:00". Used for ticket-release times. */
export function formatShortDateTime(d: Date): string {
	return `${formatCardDate(d)} ${formatTime(d, getLocale())}`;
}

/** Compact future release label for activity-card image islands. */
export function formatTicketReleaseDistance(releaseAt: Date): string | undefined {
	const now = serverNow();
	const remainingMs = releaseAt.getTime() - now.getTime();
	if (remainingMs <= 0) return undefined;

	if (remainingMs < 24 * 60 * 60 * 1_000) {
		const relative = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'always' });
		if (remainingMs < 60 * 60 * 1_000) {
			return capitalize(relative.format(Math.max(1, Math.ceil(remainingMs / 60_000)), 'minute'));
		}
		return capitalize(
			relative.format(Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1_000))), 'hour')
		);
	}

	const releaseDay = Date.UTC(releaseAt.getFullYear(), releaseAt.getMonth(), releaseAt.getDate());
	const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	if ((releaseDay - nowDay) / 86_400_000 === 1) return m.date_tomorrow();
	return formatCardDate(releaseAt);
}

/** Uppercase the first character. Used to make standalone date strings
 *  read as the start of a card line even in locales that lowercase
 *  weekdays / months by grammar (e.g. Swedish). */
function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function relativeDay(date: Date): string | undefined {
	const now = serverNow();
	const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
	const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	switch ((dateDay - nowDay) / 86_400_000) {
		case -1:
			return m.date_yesterday();
		case 0:
			return m.date_today();
		case 1:
			return m.date_tomorrow();
		default:
			return undefined;
	}
}
