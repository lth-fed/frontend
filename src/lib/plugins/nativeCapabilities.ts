import { registerPlugin } from '@capacitor/core';

export interface NativeCapabilitiesPlugin {
	get(): Promise<{ pushConfigured: boolean }>;
}

export const nativeCapabilities = registerPlugin<NativeCapabilitiesPlugin>('NativeCapabilities');
