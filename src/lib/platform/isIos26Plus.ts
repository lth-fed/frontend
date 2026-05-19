import { Device } from '@capacitor/device';

let cached: Promise<boolean> | null = null;

export function isIos26Plus(): Promise<boolean> {
	if (cached === null) cached = detect();
	return cached;
}

async function detect(): Promise<boolean> {
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
