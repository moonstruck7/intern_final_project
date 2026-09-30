import { apiRequest } from '../../shared/api/client'
import { env } from '../../shared/config/env'
import type { DashboardSummary } from './dashboard.types'

export type DashboardLoadResult =
  | { status: 'available'; data: DashboardSummary }
  | { status: 'unavailable' }

/**
 * NEEDS API CONTRACT: configure VITE_DASHBOARD_SUMMARY_PATH and map the agreed
 * server response to DashboardSummary here. This is the only dashboard API boundary.
 */
export async function getDashboardSummary(accessToken: string): Promise<DashboardLoadResult> {
  if (!env.dashboardSummaryPath) return { status: 'unavailable' }
  const data = await apiRequest<DashboardSummary>({ path: env.dashboardSummaryPath, method: 'GET', token: accessToken })
  return { status: 'available', data }
}
