import { env } from '../config/env'
import { ApiError } from './ApiError'

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  path: string
  body?: unknown
  token?: string
}

let unauthorizedHandler: (() => void) | undefined

/** Registers the app-level reaction to an expired authenticated session. */
export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler
}

export async function apiRequest<T>({ path, body, token, headers, ...options }: ApiRequestOptions): Promise<T> {
  if (!env.apiBaseUrl) throw new ApiError('API base URL is not configured. Set VITE_API_BASE_URL.')
  if (!path.startsWith('/')) throw new ApiError('API request paths must be relative and begin with /.')

  let response: Response
  try {
    response = await fetch(new URL(path, env.apiBaseUrl).toString(), {
      ...options,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Unable to reach the API. Check your connection and API configuration.')
  }

  // Mutations may legitimately reply with 201/204 and no JSON body. Parsing
  // unconditionally here turned successful saves into client-side failures.
  const responseText = await response.text()
  const payload = responseText ? (() => { try { return JSON.parse(responseText) } catch { return undefined } })() : undefined
  if (!response.ok) {
    // Login requests have no token; only an authenticated request can expire the local session.
    if (response.status === 401 && token) unauthorizedHandler?.()
    throw new ApiError('The API request failed.', response.status, payload)
  }
  return payload as T
}
