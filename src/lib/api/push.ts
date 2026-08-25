import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { api } from './clients';
import { unwrap } from './call';
import { nativeCapabilities } from '$lib/plugins/nativeCapabilities';

const PUSH_REGISTRATION_REFRESH_MS = 5 * 60_000;
const PUSH_TOKEN_TIMEOUT_MS = 15_000;

let refreshTimer: ReturnType<typeof setInterval> | undefined;
let registrationInFlight: Promise<void> | undefined;

/** Register this native installation after authentication. Web builds
 * intentionally no-op because minilith accepts APNs/FCM tokens only. */
export async function registerPushDevice(): Promise<void> {
	if (registrationInFlight) return registrationInFlight;
	registrationInFlight = performPushRegistration().finally(() => {
		registrationInFlight = undefined;
	});
	return registrationInFlight;
}

async function performPushRegistration(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	const platform = Capacitor.getPlatform();
	if (platform === 'android' && !(await nativeCapabilities.get()).pushConfigured) {
		console.warn('Push registration skipped: Firebase is not configured for this Android build');
		return;
	}

	const { PushNotifications } = await import('@capacitor/push-notifications');
	let permission = await PushNotifications.checkPermissions();
	if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions();
	if (permission.receive !== 'granted') return;

	if (platform !== 'ios' && platform !== 'android') return;
	const { identifier: deviceId } = await Device.getId();

	let resolveToken!: (token: string) => void;
	let rejectToken!: (error: unknown) => void;
	const tokenReceived = new Promise<string>((resolve, reject) => {
		resolveToken = resolve;
		rejectToken = reject;
	});
	const [registrationListener, errorListener] = await Promise.all([
		PushNotifications.addListener('registration', (token) => resolveToken(token.value)),
		PushNotifications.addListener('registrationError', (error) => rejectToken(error))
	]);
	let timeout: ReturnType<typeof setTimeout> | undefined;
	try {
		await PushNotifications.register();
		const token = await Promise.race([
			tokenReceived,
			new Promise<never>((_, reject) => {
				timeout = setTimeout(
					() => reject(new Error('Push token registration timed out')),
					PUSH_TOKEN_TIMEOUT_MS
				);
			})
		]);
		await unwrap(() =>
			api.POST('/push/register', {
				body: { platform, push_token: token, device_id: deviceId }
			})
		);
	} finally {
		if (timeout) clearTimeout(timeout);
		await Promise.all([registrationListener.remove(), errorListener.remove()]);
	}
}

/** Register immediately and refresh the native token with the backend every five minutes. */
export function startPushRegistrationRefresh(): void {
	void registerPushDevice().catch((error) => console.warn('Push registration failed', error));
	if (refreshTimer || !Capacitor.isNativePlatform()) return;
	refreshTimer = setInterval(() => {
		void registerPushDevice().catch((error) => console.warn('Push registration failed', error));
	}, PUSH_REGISTRATION_REFRESH_MS);
}

/** Stop refreshes and wait for an active registration before deregistering on logout. */
export async function stopPushRegistrationRefresh(): Promise<void> {
	if (refreshTimer) clearInterval(refreshTimer);
	refreshTimer = undefined;
	await registrationInFlight?.catch(() => undefined);
}

/** Must run while the bearer session still exists. */
export async function deregisterPushDevice(): Promise<void> {
	if (!Capacitor.isNativePlatform()) return;
	const { identifier: deviceId } = await Device.getId();
	await unwrap(() => api.POST('/push/deregister', { body: { device_id: deviceId } }));
}
