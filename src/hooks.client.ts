import { getTextDirection, getLocale } from '$lib/paraglide/runtime';
import { App as CapacitorApp } from '@capacitor/app';
import { page } from '$app/state';
import { backNavigation, replaceNavigation } from '$lib/navigation/stackNavigation';
import Routes from '$lib/navigation/routes';

CapacitorApp.addListener('backButton', () => {
	const openDialogs = document.querySelectorAll<HTMLDialogElement>('dialog:modal[open]');
	if (openDialogs.length > 0) {
		const topDialog = openDialogs[openDialogs.length - 1];
		topDialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		return;
	}
	if (backNavigation()) return;
	if (page.url.pathname === Routes.Home) {
		void CapacitorApp.minimizeApp();
		return;
	}
	void replaceNavigation(Routes.Home, { resetDepth: true });
});

export const init = () => {
	const locale = getLocale();
	const root = document.documentElement;

	root.lang = locale;
	root.dir = getTextDirection(locale);
};
