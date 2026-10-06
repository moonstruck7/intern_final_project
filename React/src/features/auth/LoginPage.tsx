import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { getLoginErrorMessage, login as loginRequest } from './authApi'

export function LoginPage() {
  const { status, login, startDevelopmentSession, lastSignOutReason } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

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
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setMessage(getLoginErrorMessage(error))
    } finally { setSubmitting(false) }
  }

  return <main className="auth-page"><div className="auth-shell">
    <aside className="auth-intro" aria-hidden="true">
      <span className="auth-mark">S</span>
      <p className="eyebrow">Salon SaaS</p>
      <h2>One calm place for daily salon operations.</h2>
      <p>Appointments, guests, services, and salon activity—ready when your shift starts.</p>
    </aside>
    <section className="auth-card">
    <p className="eyebrow">Staff portal</p><h1>Welcome back</h1>
    <p className="muted">Sign in to continue to your salon workspace.</p>
    {lastSignOutReason === 'expired' && <p className="form-error" role="alert">Your session has ended. Please sign in again.</p>}
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="identifier">Account identifier<input id="identifier" name="identifier" autoComplete="username" disabled={submitting} aria-invalid={Boolean(message)} /></label>
      <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" disabled={submitting} aria-invalid={Boolean(message)} /></label>
      {message && <p className="form-error" role="alert">{message}</p>}
      <button className="button" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
    {import.meta.env.VITE_ENABLE_DEV_SESSION === 'true' && <button className="button button-secondary" type="button" onClick={startDevelopmentSession}>Start local development session</button>}
    </section>
  </div></main>
}
