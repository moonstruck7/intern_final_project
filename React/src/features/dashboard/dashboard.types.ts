/**
 * Frontend presentation model, not a final backend schema. Map the approved
 * dashboard response to this shape in dashboardApi.ts once the contract exists.
 */
export interface DashboardMetric {
  id: string
  label: string
  value: string
  description?: string
}

export interface DashboardSection {
  id: string
  title: string
  metrics: DashboardMetric[]
}

export interface DashboardSummary {
  sections: DashboardSection[]
}
