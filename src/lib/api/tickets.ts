import { api } from './clients';
import { DEMO_MODE, unwrap } from './call';
import { guildFromPath, parseDate, pickI18n } from './mappings';
import type { ApiCallOpts } from './clients';
import type { components } from './generated/api';
import type { Guild } from '$lib/types/guild';

type RawTicket = components['schemas']['Ticket'];
type RawAddon = components['schemas']['PurchasedAddon'];

export type PurchasedAddon = {
	idx: number;
	multipleAlternatives: boolean;
	hasTextField: boolean;
	required: boolean;
	selectedOptions: number[];
	selectedText: string;
};

/** Prop names match the `<Ticket>` card component so a load function
 *  can `<Ticket {...ticket} name={…} />` without a wrapper. Field names
 *  intentionally pluralise the backend's snake_case. */
export type Ticket = {
	id: string;
	ticketKindId: string;
	activityId: string;
	ticketKindName: string;
	activityTitle: string;
	creatorName: string;
	creatorGuild?: Guild;
	/** Activity's location display string; empty if backend ships none. */
	location: string;
	timeStart: Date;
	timeEnd: Date;
	addons: PurchasedAddon[];
};

export type BuyFreeTicketInput = {
	ticketKindId: string;
	addonIds: string[];
};

function mapAddon(a: RawAddon): PurchasedAddon {
	return {
		idx: a.idx,
		multipleAlternatives: a.multiple_alternatives,
		hasTextField: a.has_text_field,
		required: a.required,
		selectedOptions: a.selected_options,
		selectedText: a.selected_text
	};
}

function mapTicket(t: RawTicket): Ticket {
	return {
		id: t.id,
		ticketKindId: t.ticket_kind_id,
		activityId: t.activity_id,
		ticketKindName: pickI18n(t.ticket_kind_name),
		activityTitle: pickI18n(t.activity_title),
		creatorName: pickI18n(t.creator_name),
		creatorGuild: guildFromPath(t.creator_path),
		location: pickI18n(t.activity_location.name),
		timeStart: parseDate(t.time_start),
		timeEnd: parseDate(t.time_end),
		addons: t.addons.map(mapAddon)
	};
}

/** List the signed-in user's purchased tickets. Spread directly onto
 *  `<Ticket {...ticket} name={…} />` — the component formats dates,
 *  derives the serial display string, etc. */
export async function listMyTickets(opts: ApiCallOpts = {}): Promise<Ticket[]> {
	const raw = DEMO_MODE ? _mockTickets : await unwrap(() => api.GET('/tickets', {}));
	return raw.map(mapTicket);
}

/**
 * Reserve a free ticket of the given kind for the signed-in user. The
 * backend returns the new ticket's id; the caller is expected to
 * re-fetch via `listMyTickets` if it wants the full row.
 */
export async function buyFreeTicket(
	input: BuyFreeTicketInput,
	opts: ApiCallOpts = {}
): Promise<string> {
	if (DEMO_MODE) return crypto.randomUUID();
	return unwrap(() =>
		api.POST('/tickets', {
			body: { ticket_kind: input.ticketKindId, addons: input.addonIds }
		})
	);
}

const _mockTickets: RawTicket[] = [
	{
		id: '00000000-0000-0000-0000-000000000100',
		ticket_kind_id: '00000000-0000-0000-0000-00000000b002',
		activity_id: 'b',
		ticket_kind_name: { en: 'Standard', sv: 'Standard' },
		activity_title: { en: 'Spring fest', sv: 'Vårfest' },
		activity_location: { name: { en: 'Kårhuset', sv: 'Kårhuset' } },
		creator_id: '00000000-0000-0000-0000-0000000000d1',
		creator_path: 'tlth.d',
		creator_name: { en: 'D-sektionen', sv: 'D-sektionen' },
		time_start: '2026-05-01T21:00:00Z',
		time_end: '2026-05-02T02:00:00Z',
		addons: []
	}
];
