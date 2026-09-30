import { apiRequest } from '../../shared/api/client'
import { ApiError } from '../../shared/api/ApiError'
import { env } from '../../shared/config/env'
import type { Session } from '../../types/auth'

export interface LoginInput { identifier: string; password: string }

export function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Unable to sign in right now. Please try again.'
  if (error.status === 401) return 'The account identifier or password is incorrect.'
  if (error.status === 400 || error.status === 422) return 'Please review your sign-in details and try again.'
  if (!env.authLoginPath || !env.apiBaseUrl) return 'Sign-in is not configured yet. The shared authentication API contract is required.'
  return 'Unable to sign in right now. Please try again.'
}

/** Adapter boundary: map this only after the shared authentication API contract is approved. */
export async function login(input: LoginInput): Promise<Session> {
  if (!env.authLoginPath) {
    throw new ApiError('Login is not configured. NEEDS API CONTRACT: set VITE_AUTH_LOGIN_PATH when the authentication endpoint is approved.')
  }
  return apiRequest<Session>({ path: env.authLoginPath, method: 'POST', body: input })
}
