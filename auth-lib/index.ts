export type UnknownError = null
export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated'
type Message = { kind: string }
type ValidatedMessage = { kind: 'validation'; validated: boolean }
type AnyMessage = Message | ValidatedMessage

const atLocation = 'teknologappen-auth-access-token'
const asLocation = 'teknologappen-auth-state'
function setAuthState(state: AuthState) {
	localStorage.setItem(asLocation, state)
}
/**
 * Begin logging in with LU SSO.
 *
 * The general flow is:
 * - call this, you get a URL back
 * - open the URL, either in an iframe or redirect to it
 *   - if in an iframe, call `onIframeResponse`
 * - the page at `continueUrl` will be redirected back to when the authentication is complete (set to "" if in an iframe)
 * - if redirected (not iframe) call the `isAuthRedirectSuccess` function on load on the page at `continueUrl`
 * - now the request middleware will get an access token
 */
export async function beginLuLogin(
	continueUrl: string,
	serverCallbackUrl?: string
): Promise<String | UnknownError> {
	const body = {
		continue_url: continueUrl,
		callback_url: serverCallbackUrl
	}
	let response: Response
	try {
		response = await fetch('https://auth.teknologappen.se/api/v0/providers/lu', {
			method: 'POST',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		})
	} catch (_e) {
		return null
	}
	if (!response.ok) return null
	let redirect: string
	try {
		redirect = await response.text()
	} catch (_e) {
		return null
	}
	setAuthState('authenticating')
	return redirect
}

export function onIframeResponse(callback: (validated: boolean) => void) {
	const listener = (e: MessageEvent) => {
		if (e.origin !== 'https://auth.teknologappen.se') {
			return
		}
		if (typeof e.data !== 'object') return
		let message: AnyMessage = e.data
		if (typeof message.kind !== 'string') return
		if (message.kind === 'validation') {
			const val = (message as ValidatedMessage).validated
			setAuthState(val ? 'authenticated' : 'unauthenticated')
			callback(val)
		}
		window.removeEventListener('message', listener)
	}
	window.addEventListener('message', listener)
}
/**
 * @returns true if auth is success
 *
 */
export function isAuthRedirectSuccess(): boolean {
	const query = new URLSearchParams(location.search)
	const val = query.get('validated') === 'true'
	setAuthState(val ? 'authenticated' : 'unauthenticated')
	return val
}

export async function authenticatedFetch(
	fetch: (info: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
	error_callback: (userMessage: { [lang: string]: string }) => void,
	info: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const at = localStorage.getItem(atLocation)
	const data = at !== null ? JSON.parse(atob(at.split('.')[1])) : {}
	const now = +new Date() / 1000

	let token = at

	if (at === null || data.exp === null || data.exp < now) {
		if (localStorage.getItem(asLocation) === 'authenticated') {
			// refresh!
			let newAt = await refresh()
			if (newAt === null) {
				// we couldn't get a new token!
				localStorage.removeItem(atLocation)
				token = null
				error_callback({
					sv: 'Du kan ha blivit hackad! Autentifieringen misslycakdes. Antingen var det mer än ett år sen du loggade in eller så har någon tagit kontroll över din webbläsare och använder nu ditt konto.',
					en: 'You may have been hacked! The authentication failed. Either you last logged in more than a year ago, or someone has taken control of your browser and are now using your account.'
				})
			} else {
				token = newAt
				localStorage.setItem(atLocation, newAt)
			}
		} else {
			// we don't have a token or it's invalid
			localStorage.removeItem(atLocation)
			token = null
		}
	}

	let newInit: RequestInit | undefined =
		token === null
			? init
			: {
					...init,
					headers: {
						...init?.headers,
						authorization: `Bearer {token}`
					}
				}
	return await fetch(info, newInit)
}

async function refresh(): Promise<string | UnknownError> {
	try {
		const response = await fetch('https://auth.teknologappen.se/api/v0/refresh', {
			method: 'POST',
			credentials: 'include',
			headers: { 'content-type': 'application/json' }
		})
		const json = await response.json()
		const accessToken = json.access_token
		return accessToken
	} catch (_e) {
		return null
	}
}
