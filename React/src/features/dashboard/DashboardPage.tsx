import { useEffect, useState } from 'react'
import { ErrorState, EmptyState, LoadingState } from '../../shared/components/AsyncStates'
import { useAuth } from '../auth/AuthProvider'
import { getDashboardSummary } from './dashboardApi'
import { DashboardMetricCard } from './DashboardMetricCard'
import type { DashboardSummary } from './dashboard.types'

type DashboardState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'ready'; data: DashboardSummary }

export function DashboardPage() {
  const { session } = useAuth()
  const [state, setState] = useState<DashboardState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    if (!session) return
    setState({ status: 'loading' })
    getDashboardSummary(session.accessToken)
      .then((result) => active && setState(result.status === 'unavailable' ? { status: 'unavailable' } : { status: 'ready', data: result.data }))
      .catch(() => active && setState({ status: 'error' }))
    return () => { active = false }
  }, [session])

  return <section className="dashboard-page"><div className="page-heading"><div><p className="eyebrow">A1 Platform Foundation</p><h1>Dashboard</h1></div></div>
    {state.status === 'loading' && <LoadingState label="Loading dashboard…" />}
    {state.status === 'unavailable' && <EmptyState title="Dashboard data is not configured" description="NEEDS API CONTRACT: approve the dashboard response and configure VITE_DASHBOARD_SUMMARY_PATH. No salon statistics are displayed until then." />}
    {state.status === 'error' && <ErrorState title="Dashboard data could not be loaded" description="Please try again. If this continues, verify the shared API configuration and authorization." />}
    {state.status === 'ready' && (state.data.sections.length ? <div className="dashboard-sections">{state.data.sections.map((section) => <section key={section.id}><h2>{section.title}</h2><div className="dashboard-grid">{section.metrics.map((metric) => <DashboardMetricCard key={metric.id} metric={metric} />)}</div></section>)}</div> : <EmptyState title="No dashboard data is available" description="The shared API returned no dashboard sections for your current access." />)}
  </section>
}
