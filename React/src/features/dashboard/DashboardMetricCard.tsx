import type { DashboardMetric } from './dashboard.types'

export function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
  return <article className="dashboard-card">
    <p className="eyebrow">{metric.label}</p>
    <p className="dashboard-value">{metric.value}</p>
    {metric.description && <p className="muted">{metric.description}</p>}
  </article>
}
