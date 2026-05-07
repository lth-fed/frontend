import { getTextDirection, getLocale } from '$lib/paraglide/runtime';

export const init = () => {
	const locale = getLocale();
	const root = document.documentElement;

	root.lang = locale;
	root.dir = getTextDirection(locale);
};
