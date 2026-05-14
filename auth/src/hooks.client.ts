import { getTextDirection, getLocale } from '$lib/paraglide/runtime';
import { i18n } from 'common-lib';

export const init = () => {
	const locale = getLocale();
	i18n.setLang(locale)
	const root = document.documentElement;

	root.lang = locale;
	root.dir = getTextDirection(locale);
};
