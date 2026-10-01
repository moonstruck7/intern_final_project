import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { getLoginErrorMessage, login as loginRequest } from './authApi'

export function LoginPage() {
  const { status, login, startDevelopmentSession, lastSignOutReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTarget = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'
  const [message, setMessage] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  if (status === 'authenticated') return <Navigate to={redirectTarget} replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const identifier = String(form.get('identifier') || '').trim()
    const password = String(form.get('password') || '')
    if (!identifier) return setMessage('Enter your account identifier.')
    if (!password) return setMessage('Enter your password.')
    setSubmitting(true); setMessage(undefined)
    try {
      login(await loginRequest({ loginIdentifier: identifier, password }))
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      setMessage(getLoginErrorMessage(error))
    } finally { setSubmitting(false) }
  }

  return <main className="auth-page"><section className="auth-card">
    <p className="eyebrow">Salon SaaS Platform</p><h1>Sign in to the staff portal</h1>
    <p className="muted">Authentication will use the shared backend when its approved contract is configured.</p>
    {lastSignOutReason === 'expired' && <p className="form-error" role="alert">Your session has ended. Please sign in again.</p>}
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="identifier">Account identifier<input id="identifier" name="identifier" autoComplete="username" disabled={submitting} aria-invalid={Boolean(message)} /></label>
      <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" disabled={submitting} aria-invalid={Boolean(message)} /></label>
      {message && <p className="form-error" role="alert">{message}</p>}
      <button className="button" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
    {import.meta.env.VITE_ENABLE_DEV_SESSION === 'true' && <button className="button button-secondary" type="button" onClick={startDevelopmentSession}>Start local development session</button>}
  </section></main>
}
