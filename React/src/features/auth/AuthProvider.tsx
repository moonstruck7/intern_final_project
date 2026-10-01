import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { setUnauthorizedHandler } from '../../shared/api/client'
import { isAllowed, type AccessRequirement } from '../../shared/auth/access'
import type { Session, SessionUser } from '../../types/auth'
import { currentUser, logoutRequest, refresh } from './authApi'

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
    if (!session || typeof session.accessToken !== 'string' || typeof session.refreshToken !== 'string' || !session.user || typeof session.user.id !== 'string' || !Array.isArray(session.user.permissions)) {
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
    if (!restored) { setStatus('unauthenticated'); return }
    refresh(restored.refreshToken).then(async (next) => {
      const user = await currentUser(next.accessToken)
      login({ ...next, user: { ...next.user, ...user, displayName: next.user.displayName || next.user.loginIdentifier || 'Staff user' } })
    }).catch(() => { sessionStorage.removeItem(SESSION_KEY); setStatus('unauthenticated') })
  }, [])

  const login = useCallback((nextSession: Session) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    setStatus('authenticated')
    setLastSignOutReason(undefined)
  }, [])
  const logout = useCallback((reason: SignOutReason = 'manual') => {
    const current = readStoredSession()
    if (reason === 'manual' && current) void logoutRequest(current.refreshToken).catch(() => undefined)
    sessionStorage.removeItem(SESSION_KEY)
    setSession(undefined)
    setStatus('unauthenticated')
    setLastSignOutReason(reason)
  }, [])
  const startDevelopmentSession = useCallback(() => undefined, [])
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
