import { Link } from 'react-router-dom'

export function AccessDeniedPage({ returnTo }: { returnTo?: string }) {
  return <section className="state-card error-state" role="alert">
    <h1>Access restricted</h1>
    <p>You do not have access to this area. Contact your administrator if you believe this is incorrect.</p>
    {returnTo && <p className="visually-hidden">Restricted path: {returnTo}</p>}
    <Link className="button" to="/dashboard">Return to dashboard</Link>
  </section>
}
