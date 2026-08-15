export { auth, api, makeAuth, makeApi } from './clients';
export { DEMO_MODE, unwrap, attempt } from './call';
export type { BadRequest, Attempt } from './call';
export { apiError, errorMessage, extractErrorMessage, isConnectivityError } from './errors';
export type { ApiErrorKind } from './errors';
export { pickI18n, guildFromPath, parseDate, mapLocation, locationLabel } from './mappings';
export type { Location } from './mappings';
export { cached, peek, seed, invalidate, invalidatePrefix, clearCache } from './cache';

export {
	listActivities,
	getActivity,
	getActivityTicketKinds,
	cachedActivities,
	cachedActivity,
	cachedTicketKinds
} from './activities';
export type {
	Activity,
	ActivityOrganiser,
	ActivityContact,
	TicketKind,
	AvailableAddon,
	AddonOption
} from './activities';

export {
	listGroups,
	cachedGroups,
	getGroup,
	cachedGroup,
	listJoinableGroups,
	cachedJoinableGroups,
	requestGroupMembership,
	listGroupSettings,
	cachedGroupSettings,
	setGroupSetting,
	createGroup,
	listMembers,
	listAdmins,
	addAdmin,
	removeAdmin
} from './groups';
export type {
	Group,
	JoinableGroup,
	GroupSetting,
	NotificationLevel,
	Adminship,
	CreateGroupInput
} from './groups';

export { getMe, cachedMe, majorityGuild, themeGuild, setLanguage } from './user';
export type { Me, MyGroup } from './user';

export {
	listMyTickets,
	cachedMyTickets,
	listPurchasedTickets,
	cachedPurchasedTickets,
	buyReservation,
	enterQueue,
	queueStatus,
	leaveQueue,
	receiptBlob,
	transferTicket
} from './tickets';
export type {
	Ticket,
	PurchasedAddon,
	PurchaseProvider,
	BuyReservationInput,
	BuyReservationOutcome,
	QueueStatus,
	QueueStatusResult,
	PurchaseStatus
} from './tickets';

export {
	listValidationActivities,
	validateTicket,
	ticketQrPayload,
	parseTicketQrPayload
} from './validation';
export type { ValidationActivity, ValidationResult, TicketQrPayload } from './validation';

export { healthcheck } from './healthcheck';

export type { paths as AuthPaths, components as AuthComponents } from './generated/auth';
export type { paths as ApiPaths, components as ApiComponents } from './generated/api';
