import { registerPlugin } from '@capacitor/core';
import type { TabsBarPlugin } from './definitions';

export const tabsBar = registerPlugin<TabsBarPlugin>('TabsBar', {
	web: () => import('./web').then((module) => new module.TabsBarWeb())
});
