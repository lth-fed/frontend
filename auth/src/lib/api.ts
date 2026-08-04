import { dev } from '$app/environment';

export const AUTH_API_ORIGIN = dev ? 'http://localhost:8001' : 'https://api.auth.teknologappen.se';

export const authApiUrl = (path: string) => `${AUTH_API_ORIGIN}${path}`
