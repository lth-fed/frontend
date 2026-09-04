import { Capacitor } from '@capacitor/core';
import { ScreenBrightness } from '@capacitor-community/screen-brightness';

let previousBrightness: number | null = null;

export async function requestMaxBrightness(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;

	try {
		const { brightness } = await ScreenBrightness.getBrightness();
		previousBrightness = brightness;
		await ScreenBrightness.setBrightness({ brightness: 1 });
	} catch {
		previousBrightness = null;
	}
}

export async function restoreBrightness(): Promise<void> {
	if (!Capacitor.isNativePlatform() || previousBrightness === null) return;

	const brightness = previousBrightness;
	previousBrightness = null;

	try {
		await ScreenBrightness.setBrightness({ brightness });
	} catch {
		// ignore, brightness will remain at max until the OS resets it
	}
}
