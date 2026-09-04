import type { components } from './generated/api';
import { api } from './clients';
import { cached } from './cache';
import { DEMO_MODE, unwrap } from './call';
import { parseDate, pickI18n } from './mappings';

type Depends = (dep: `app:cache:${string}`) => void;
type RawNotification = components['schemas']['Notification'];

export type NotificationHistoryItem = {
	id: string;
	activityId?: string;
	sender: string;
	title: string;
	content: string;
	sentAt: Date;
};

function mapNotification(notification: RawNotification): NotificationHistoryItem {
	return {
		id: notification.id,
		activityId: notification.activity_id,
		sender: pickI18n(notification.sender),
		title: pickI18n(notification.title),
		content: pickI18n(notification.content),
		sentAt: parseDate(notification.send_at)
	};
}

export async function activityFollowSetting(activityId: string): Promise<boolean> {
	if (DEMO_MODE) return false;
	const settings = await unwrap(() => api.GET('/user/activity-settings', {}));
	return settings.find((setting) => setting.activity_id === activityId)?.follow ?? false;
}

export async function setActivityFollow(activityId: string, follow: boolean): Promise<void> {
	if (DEMO_MODE) return;
	await unwrap(() =>
		api.PUT('/user/activity-settings', {
			body: { activity_id: activityId, follow }
		})
	);
}

export async function listNotificationHistory(): Promise<NotificationHistoryItem[]> {
	if (DEMO_MODE) return [];
	const notifications = await unwrap(() => api.GET('/user/notifications', {}));
	return notifications.map(mapNotification);
}

export function cachedNotificationHistory(depends?: Depends): Promise<NotificationHistoryItem[]> {
	return cached('notification-history', 60_000, listNotificationHistory, depends);
}
