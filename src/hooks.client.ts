import { getTextDirection, getLocale } from '$lib/paraglide/runtime';
import { App as CapacitorApp } from '@capacitor/app';

CapacitorApp.addListener('backButton', ({ canGoBack }) => {
	if (!canGoBack) {
		CapacitorApp.exitApp();
	} else {
		window.history.back();
	}
});

export const init = () => {
	const locale = getLocale();
	const root = document.documentElement;

	root.lang = locale;
	root.dir = getTextDirection(locale);
};
