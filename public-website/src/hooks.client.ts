import { getLocale, getTextDirection } from '$lib/paraglide/runtime';

export const init = () => {
	const locale = getLocale();
	document.documentElement.lang = locale;
	document.documentElement.dir = getTextDirection(locale);
};
