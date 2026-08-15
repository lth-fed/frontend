import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { api } from './clients';
import { unwrap } from './call';

/** Register this native installation after authentication. Web builds
 * intentionally no-op because minilith accepts APNs/FCM tokens only. */
export async function registerPushDevice(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;

	const { PushNotifications } = await import('@capacitor/push-notifications');
	let permission = await PushNotifications.checkPermissions();
	if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions();
	if (permission.receive !== 'granted') return;

	const platform = Capacitor.getPlatform();
	if (platform !== 'ios' && platform !== 'android') return;
	const { identifier: deviceId } = await Device.getId();

	const registration = new Promise<string>((resolve, reject) => {
		void PushNotifications.addListener('registration', (token) => resolve(token.value));
		void PushNotifications.addListener('registrationError', (error) => reject(error));
	});
	await PushNotifications.register();
	const token = await registration;
	await unwrap(() =>
		api.POST('/push/register', {
			body: { platform, push_token: token, device_id: deviceId }
		})
	);
}

/** Must run while the bearer session still exists. */
export async function deregisterPushDevice(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	const { identifier: deviceId } = await Device.getId();
	await unwrap(() => api.POST('/push/deregister', { body: { device_id: deviceId } }));
}
