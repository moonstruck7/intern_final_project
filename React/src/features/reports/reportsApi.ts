import { ApiError } from '../../shared/api/ApiError'
import type { ReportingArea } from './reports.types'

export interface ReportsContractRequirement {
  area: ReportingArea
  missing: readonly string[]
}

/**
 * B4 is an integration boundary. There are no approved reporting, campaign,
 * or notification endpoints or schemas in this repository, so no requests or
 * fabricated results are produced here.
 */
export const reportsContract: readonly ReportsContractRequirement[] = [
  { area: 'reports', missing: ['report list/detail/result and export endpoints', 'report definition and result schemas', 'filter, date-range, timezone, sorting and pagination semantics', 'export formats and authorization'] },
  { area: 'analytics', missing: ['backend-produced appointment, customer, service, billing, staff and inventory analytics', 'metric/KPI definitions, calculations and aggregation periods', 'request, response, filtering and authorization schemas'] },
  { area: 'insights', missing: ['business-insight endpoint/schema', 'backend-owned insight generation and prioritization rules', 'insight relationships, filtering and authorization'] },
  { area: 'marketing', missing: ['campaign and segmentation endpoints/schemas', 'targeting, promotion, delivery, lifecycle and history rules', 'validation and authorization'] },
  { area: 'notifications', missing: ['notification list/detail/action endpoints and schema', 'trigger, channel, read-state and preference rules', 'delivery integration, validation and authorization'] },
]

export function getReportsContractRequirement(area: ReportingArea): ReportsContractRequirement {
  return reportsContract.find((requirement) => requirement.area === area)!
}

/** Used by future B4 operations until the approved backend operation is mapped. */
export function unsupportedReportsOperation(area: ReportingArea): never {
  throw new ApiError(`The reports ${area} API is not configured. NEEDS API CONTRACT.`)
}
