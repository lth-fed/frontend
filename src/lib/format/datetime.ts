import { getLocale } from '$lib/paraglide/runtime';

/** Compact form for list cards. Order/words follow current paraglide
 *  locale; first letter capitalized so it reads as the start of the
 *  card line. EN: "Mon, Apr 27". SV: "Mån. 27 apr.". */
export function formatCardDate(d: Date): string {
	const locale = getLocale();
	const date = new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	}).format(d);
	return `${capitalize(date)}`;
}

/** Verbose form for the detail head; first letter capitalized.
 *  EN: "Monday, 27 Apr". SV: "Måndag 27 apr.". */
export function formatDetailDate(d: Date): string {
	return capitalize(
		new Intl.DateTimeFormat(getLocale(), {
			weekday: 'long',
			day: 'numeric',
			month: 'short'
		}).format(d)
	);
}

/** Time range, e.g. "17:00 - 23:00". 24-hour in both locales. */
export function formatTimeRange(start: Date, end: Date): string {
	const locale = getLocale();
	return `${formatTime(start, locale)} - ${formatTime(end, locale)}`;
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

/** Uppercase the first character. Used to make standalone date strings
 *  read as the start of a card line even in locales that lowercase
 *  weekdays / months by grammar (e.g. Swedish). */
function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
