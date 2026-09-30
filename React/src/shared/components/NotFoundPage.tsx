import { Link } from 'react-router-dom'
export function NotFoundPage() { return <main className="auth-page"><section className="auth-card"><h1>Page not found</h1><p className="muted">The requested page does not exist.</p><Link className="button" to="/dashboard">Go to dashboard</Link></section></main> }
