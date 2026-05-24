import { replaceNavigation } from '$lib/navigation/stackNavigation';

// Temporary redirect for demo purposes
export const load = async () => {
	return replaceNavigation('/demo/homepage/');
};
