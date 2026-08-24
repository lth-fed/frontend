import type { components } from './generated/api';
import { api } from './clients';
import { cached } from './cache';
import { DEMO_MODE, unwrap } from './call';
import { parseDate, pickI18n } from './mappings';

type Depends = (dep: `app:cache:${string}`) => void;
type RawNotification = components['schemas']['Notification'];

export type NotificationHistoryItem = {
	id: string;
	title: string;
	content: string;
	sentAt: Date;
};

function mapNotification(notification: RawNotification): NotificationHistoryItem {
	return {
		id: notification.id,
		title: pickI18n(notification.title),
		content: pickI18n(notification.content),
		sentAt: parseDate(notification.send_at)
	};
}

export async function listNotificationHistory(): Promise<NotificationHistoryItem[]> {
	if (DEMO_MODE) return [];
	const notifications = await unwrap(() => api.GET('/user/notifications', {}));
	return notifications.map(mapNotification);
}

export function cachedNotificationHistory(depends?: Depends): Promise<NotificationHistoryItem[]> {
	return cached('notification-history', 60_000, listNotificationHistory, depends);
}
