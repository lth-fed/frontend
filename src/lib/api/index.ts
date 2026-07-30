export { auth, api, makeAuth, makeApi } from './clients';
export { DEMO_MODE, unwrap, attempt } from './call';
export type { BadRequest, Attempt } from './call';
export { apiError, extractErrorMessage } from './errors';
export type { ApiErrorKind } from './errors';
export { pickI18n, guildFromPath, parseDate } from './mappings';
export { cached, peek, seed, invalidate, invalidatePrefix, clearCache } from './cache';

export {
	listActivities,
	getActivity,
	getActivityTicketKinds,
	cachedActivities,
	cachedActivity,
	cachedTicketKinds
} from './activities';
export type { Activity, TicketKind } from './activities';

export { listGroups, createGroup, listMembers, listAdmins, addAdmin, removeAdmin } from './groups';
export type { Group, Adminship, CreateGroupInput } from './groups';

export { getMe, cachedMe, majorityGuild } from './user';
export type { Me, MyGroup } from './user';

export {
	listMyTickets,
	cachedMyTickets,
	buyReservation,
	enterQueue,
	queueStatus,
	leaveQueue,
	dropReservation
} from './tickets';
export type {
	Ticket,
	PurchasedAddon,
	PurchaseProvider,
	BuyReservationInput,
	BuyReservationOutcome,
	QueueStatus,
	PurchaseStatus
} from './tickets';

export { healthcheck } from './healthcheck';

export type { paths as AuthPaths, components as AuthComponents } from './generated/auth';
export type { paths as ApiPaths, components as ApiComponents } from './generated/api';
