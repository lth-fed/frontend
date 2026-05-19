import { registerPlugin } from '@capacitor/core';
import type { NativeButtonPlugin } from './definitions';

export const nativeButton = registerPlugin<NativeButtonPlugin>('NativeButton', {
	web: () => import('./web').then((module) => new module.NativeButtonWeb())
});
