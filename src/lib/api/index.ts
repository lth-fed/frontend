export { auth, api, makeAuth, makeApi } from './clients';
export type { ApiCallOpts } from './clients';
export { DEMO_MODE, unwrap } from './call';
export { apiError, extractErrorMessage } from './errors';
export type { ApiErrorKind } from './errors';
export { pickI18n, guildFromPath, parseDate } from './mappings';

export { listActivities, getActivity, getActivityTicketKinds } from './activities';
export type { Activity, TicketKind } from './activities';

export { listGroups, createGroup, listMembers, listAdmins, addAdmin, removeAdmin } from './groups';
export type { Group, Adminship, CreateGroupInput } from './groups';

export { getMe, majorityGuild } from './user';
export type { Me, MyGroup } from './user';

export { listMyTickets, buyFreeTicket } from './tickets';
export type { Ticket, PurchasedAddon, BuyFreeTicketInput } from './tickets';

export { healthcheck } from './healthcheck';

export type { paths as AuthPaths, components as AuthComponents } from './generated/auth';
export type { paths as ApiPaths, components as ApiComponents } from './generated/api';
