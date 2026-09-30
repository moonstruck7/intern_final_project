import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { env } from '../../shared/config/env'
import { setUnauthorizedHandler } from '../../shared/api/client'
import { isAllowed, type AccessRequirement } from '../../shared/auth/access'
import type { Session, SessionUser } from '../../types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
type SignOutReason = 'manual' | 'expired'
interface AuthContextValue {
  status: AuthStatus
  session?: Session
  user?: SessionUser
  login: (session: Session) => void
  startDevelopmentSession: () => void
  logout: (reason?: SignOutReason) => void
  can: (requirement?: AccessRequirement) => boolean
  lastSignOutReason?: SignOutReason
}

const SESSION_KEY = 'salon-saas.session'
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): Session | undefined {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const session = raw ? JSON.parse(raw) as Session : undefined
    if (!session || typeof session.accessToken !== 'string' || !session.user || typeof session.user.id !== 'string' || typeof session.user.displayName !== 'string' || !Array.isArray(session.user.permissions)) {
      sessionStorage.removeItem(SESSION_KEY)
      return undefined
    }
    return session
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return undefined
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session>()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [lastSignOutReason, setLastSignOutReason] = useState<SignOutReason>()

  useEffect(() => {
    const restored = readStoredSession()
    setSession(restored)
    setStatus(restored ? 'authenticated' : 'unauthenticated')
  }, [])

  const login = useCallback((nextSession: Session) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setStatus('authenticated')
    setLastSignOutReason(undefined)
  }, [])
  const logout = useCallback((reason: SignOutReason = 'manual') => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(undefined)
    setStatus('unauthenticated')
    setLastSignOutReason(reason)
  }, [])
  const startDevelopmentSession = useCallback(() => {
    if (!env.enableDevSession) return
    login({ accessToken: 'development-session-not-a-production-token', user: { id: 'development-user', displayName: 'Development session', permissions: ['*'] } })
  }, [login])
  const can = useCallback((requirement?: AccessRequirement) => {
    if (!session) return false
    if (session.user.permissions.includes('*')) return true
    return isAllowed(requirement, session.user.permissions)
  }, [session])

  useEffect(() => {
    setUnauthorizedHandler(() => logout('expired'))
    return () => setUnauthorizedHandler(undefined)
  }, [logout])

  const value = useMemo(() => ({ status, session, user: session?.user, login, logout, startDevelopmentSession, can, lastSignOutReason }), [status, session, login, logout, startDevelopmentSession, can, lastSignOutReason])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
