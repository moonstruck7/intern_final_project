import { useEffect, useState } from 'react'
import { ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { useAuth } from '../auth/AuthProvider'
import { getDashboardSummary } from './dashboardApi'
import type { BackendSummary } from './dashboardApi'
type DashboardState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: BackendSummary }

export function DashboardPage() {
  const { session, user, can } = useAuth()
  const [state, setState] = useState<DashboardState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    if (!session || !can({ permissions: ['reports.read'] })) return
    setState({ status: 'loading' })
    getDashboardSummary(session.accessToken)
      .then((data) => active && setState({ status: 'ready', data }))
      .catch(() => active && setState({ status: 'error' }))
    return () => { active = false }
  }, [session, can])

  const isStaffWorkspace = !can({ permissions: ['reports.read'] })

  if (isStaffWorkspace) return <section className="dashboard-page"><div className="page-heading"><div><p className="eyebrow">Today at the salon</p><h1>Ready for the day, {user?.displayName?.split(' ')[0] || 'there'}.</h1><p className="page-intro">Your workspace keeps the focus on the day ahead and the guests you look after.</p></div></div><div className="staff-workspace"><article className="staff-priority"><p className="eyebrow">Your focus</p><h2>Prepare for a smooth shift</h2><p>Appointment and guest details will appear here when they are shared with your staff role.</p></article><article className="staff-note"><span aria-hidden="true">✦</span><h2>Stay in the loop</h2><p>Use this workspace to return to your operational updates throughout the day.</p></article></div></section>

  return <section className="dashboard-page"><div className="page-heading"><div><p className="eyebrow">Salon overview</p><h1>Welcome back, {user?.displayName?.split(' ')[0] || 'there'}.</h1><p className="page-intro">A focused view of the activity shaping your salon today.</p></div></div>
    {state.status === 'loading' && <LoadingState label="Loading dashboard…" />}
    {state.status === 'error' && <ErrorState title="Your overview is temporarily unavailable" description="Please refresh the page and try again." />}
    {state.status === 'ready' && <div className="dashboard-sections"><div className="dashboard-grid"><article className="metric-card"><p>Recorded payment total</p><strong>{state.data.paymentRevenueMinor.toLocaleString()}</strong></article><article className="metric-card"><p>Payments received</p><strong>{state.data.paymentCount.toLocaleString()}</strong></article><article className="metric-card"><p>Appointments</p><strong>{state.data.appointmentCount.toLocaleString()}</strong></article><article className="metric-card"><p>Low-stock products</p><strong>{state.data.lowStockCount.toLocaleString()}</strong></article></div><p className="muted">Your dashboard updates as salon activity is recorded.</p></div>}
  </section>
}
