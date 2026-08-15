import { dev } from '$app/environment';

export const AUTH_API_ORIGIN = dev ? 'http://localhost:8001' : 'https://api.auth.teknologappen.se';

export const authApiUrl = (path: string) => `${AUTH_API_ORIGIN}${path}`

export const errorMsg: (body: string) => {message: string, field: string | null} = (body: string)  => {
    try {
        const json = JSON.parse(body)
        return ({
            message: json.message ?? body,
            field: json.field ?? null,
        })
    } catch (_) {
        return ({
            message: body,
            field: null,
        })
    }
}
