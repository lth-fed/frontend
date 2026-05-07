import { registerPlugin } from '@capacitor/core';
import type { TabsBarPlugin } from './definitions';

export const tabsBar = registerPlugin<TabsBarPlugin>('TabsBar');
