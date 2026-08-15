import type { PageLoad } from './$types';
import { listValidationActivities } from '$lib/api/validation';

export const load: PageLoad = async () => ({ activities: await listValidationActivities() });
