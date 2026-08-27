import { api } from './clients';
import { attempt, DEMO_MODE, unwrap, type Attempt } from './call';
import { parseDate, pickI18n } from './mappings';
import type { components } from './generated/api';

export type ValidationActivity = {
	id: string;
	title: string;
	description: string;
	startAt: Date;
	endAt: Date;
	imageUrl: string;
};

export type ValidationResult = {
	verified: boolean;
	ticketKindName: string;
	ownerId?: string;
	ownerName?: string;
	hasBeenTransferred: boolean;
	purchaserName?: string;
	previousVerifications: Date[];
	purchasedAddons: { name: string; selectedOptionNames: string[] }[];
};

export type TicketQrPayload = { tid: string; t: number };

export function ticketQrPayload(ticketId: string, now = Date.now()): string {
	return JSON.stringify({ tid: ticketId, t: Math.floor(now / 1000) } satisfies TicketQrPayload);
}

export function parseTicketQrPayload(value: string): TicketQrPayload | undefined {
	try {
		const payload: unknown = JSON.parse(value);
		if (
			typeof payload === 'object' &&
			payload !== null &&
			typeof (payload as TicketQrPayload).tid === 'string' &&
			(payload as TicketQrPayload).tid.length > 0 &&
			Number.isInteger((payload as TicketQrPayload).t) &&
			(payload as TicketQrPayload).t > 0
		) {
			return payload as TicketQrPayload;
		}
	} catch {
		// A malformed or unrelated QR is a normal scanner result.
	}
	return undefined;
}

export async function listValidationActivities(): Promise<ValidationActivity[]> {
	if (DEMO_MODE) return [];
	const activities = await unwrap(() => api.GET('/tickets/validate', {}));
	return activities.map((activity) => ({
		id: activity.id,
		title: pickI18n(activity.title),
		description: pickI18n(activity.description),
		startAt: parseDate(activity.time_start),
		endAt: parseDate(activity.time_end),
		imageUrl: activity.image_url
	}));
}

export async function validateTicket(payload: TicketQrPayload): Promise<Attempt<ValidationResult>> {
	if (DEMO_MODE) {
		return {
			ok: {
				verified: true,
				ticketKindName: 'Demo ticket',
				ownerName: 'Demo User',
				hasBeenTransferred: false,
				purchaserName: 'Demo User',
				previousVerifications: [],
				purchasedAddons: []
			}
		};
	}
	const result = await attempt<components['schemas']['ValidateResponse']>(() =>
		api.POST('/tickets/validate', {
			body: {
				purchased_ticket_id: payload.tid,
				created_at: new Date(payload.t * 1000).toISOString()
			}
		})
	);
	if (result.badRequest) return result;
	return {
		ok: {
			verified: result.ok.verified,
			ticketKindName: pickI18n(result.ok.ticket_kind_name),
			ownerId: result.ok.owner_id,
			ownerName: result.ok.owner_name,
			hasBeenTransferred: result.ok.has_been_transfered,
			purchaserName: result.ok.purchaser_name,
			previousVerifications: result.ok.previous_verifications.map((entry) => parseDate(entry.at)),
			purchasedAddons: result.ok.purchased_addons.map((addon) => ({
				name: pickI18n(addon.name),
				selectedOptionNames: [
					...addon.selected_options.flatMap((selected) => {
						const option = addon.options.find((option) => option.idx === selected);
						return option ? [pickI18n(option.name)] : [];
					}),
					...(addon.selected_text.trim() ? [addon.selected_text] : [])
				]
			}))
		}
	};
}
