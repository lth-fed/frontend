import { Device } from '@capacitor/device';

/** Returns true when the app is running on iOS 26 or newer. */
export async function isIos26Plus(): Promise<boolean> {
	try {
		const info = await Device.getInfo();

		if (info.platform !== 'ios') {
			return false;
		}

		if (typeof info.iOSVersion === 'number') {
			return info.iOSVersion >= 260000;
		}

		const majorVersion = Number.parseInt(info.osVersion?.split('.')[0] ?? '', 10);
		return Number.isFinite(majorVersion) && majorVersion >= 26;
	} catch {
		return false;
	}
}
