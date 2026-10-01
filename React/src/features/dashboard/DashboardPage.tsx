import { useEffect, useState } from 'react'
import { ErrorState, LoadingState } from '../../shared/components/AsyncStates'
import { useAuth } from '../auth/AuthProvider'
import { getDashboardSummary } from './dashboardApi'
import type { BackendSummary } from './dashboardApi'
type DashboardState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: BackendSummary }

export function DashboardPage() {
  const { session } = useAuth()
  const [state, setState] = useState<DashboardState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    if (!session) return
    setState({ status: 'loading' })
    getDashboardSummary(session.accessToken)
      .then((data) => active && setState({ status: 'ready', data }))
      .catch(() => active && setState({ status: 'error' }))
    return () => { active = false }
  }, [session])

  return <section className="dashboard-page"><div className="page-heading"><div><p className="eyebrow">A1 Platform Foundation</p><h1>Dashboard</h1></div></div>
    {state.status === 'loading' && <LoadingState label="Loading dashboard…" />}
    {state.status === 'error' && <ErrorState title="Dashboard data could not be loaded" description="Please try again. If this continues, verify the shared API configuration and authorization." />}
    {state.status === 'ready' && <div className="dashboard-grid"><article className="metric-card"><p>Recorded payment revenue</p><strong>{state.data.paymentRevenueMinor}</strong></article><article className="metric-card"><p>Payments</p><strong>{state.data.paymentCount}</strong></article><article className="metric-card"><p>Appointments</p><strong>{state.data.appointmentCount}</strong></article><article className="metric-card"><p>Low-stock products</p><strong>{state.data.lowStockCount}</strong></article></div>}
  </section>
}
