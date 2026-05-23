import { redirect } from '@sveltejs/kit';
import { finishWebLogin } from '$lib/auth/bootstrap';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async () => {
	await finishWebLogin();
	redirect(303, '/');
};
