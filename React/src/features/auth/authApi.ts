import { apiRequest } from '../../shared/api/client'
import { ApiError } from '../../shared/api/ApiError'
import { env } from '../../shared/config/env'
import type { Session, SessionUser } from '../../types/auth'

export interface LoginInput { loginIdentifier: string; password: string }

export function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Unable to sign in right now. Please try again.'
  if (error.status === 401) return 'The account identifier or password is incorrect.'
  if (error.status === 400 || error.status === 422) return 'Please review your sign-in details and try again.'
  if (!env.apiBaseUrl) return 'Sign-in is not configured yet. Set VITE_API_BASE_URL.'
  return 'Unable to sign in right now. Please try again.'
}

export async function login(input: LoginInput): Promise<Session> {
  return normalize(await apiRequest<Session & { user: SessionUser & { loginIdentifier?: string } }>({ path: '/api/v1/auth/login', method: 'POST', body: input }))
}

function normalize(session: Session & { user: SessionUser & { loginIdentifier?: string } }): Session { return { ...session, user: { ...session.user, displayName: session.user.displayName || session.user.loginIdentifier || 'Staff user', permissions: session.user.permissions || [] } } }
export async function refresh(refreshToken: string): Promise<Session> { return normalize(await apiRequest<Session & { user: SessionUser & { loginIdentifier?: string } }>({ path: '/api/v1/auth/refresh', method: 'POST', body: { refreshToken } })) }
export async function logoutRequest(refreshToken: string): Promise<void> { await apiRequest<void>({ path: '/api/v1/auth/logout', method: 'POST', body: { refreshToken } }) }
export async function currentUser(accessToken: string): Promise<SessionUser> { const response = await apiRequest<{ user: SessionUser }>({ path: '/api/v1/auth/me', method: 'GET', token: accessToken }); return response.user }
