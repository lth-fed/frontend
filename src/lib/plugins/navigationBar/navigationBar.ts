import { registerPlugin } from '@capacitor/core';
import type { NavigationBarPlugin } from './definitions';

export const navigationBar = registerPlugin<NavigationBarPlugin>('NavigationBar', {
	web: () => import('./web').then((module) => new module.NavigationBarWeb())
});
