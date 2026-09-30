import { ApiError } from '../../shared/api/ApiError'
import type { StaffArea } from './staff.types'

export interface StaffContractRequirement {
  area: StaffArea
  missing: readonly string[]
}

/**
 * Contract boundary only. The repository has no approved staff endpoints,
 * schemas, role/designation values, or scheduling rules to map yet.
 */
export const staffContract: readonly StaffContractRequirement[] = [
  { area: 'staff', missing: ['list/create/update/detail endpoints', 'staff request and response schema', 'profile fields', 'business designation values', 'status values and transitions', 'search/filter/pagination semantics', 'staff-administration authorization'] },
  { area: 'scheduling', missing: ['schedule and availability endpoints/schema', 'date/time and timezone representation', 'staff-service capability relationship', 'schedule validation and authorization'] },
  { area: 'attendance', missing: ['attendance endpoint/schema', 'attendance statuses and clock rules', 'history/filter behavior and authorization'] },
  { area: 'leave', missing: ['leave endpoint/schema', 'leave types, quotas, approval and cancellation rules', 'history/filter behavior and authorization'] },
]

export function getStaffContractRequirement(area: StaffArea): StaffContractRequirement {
  return staffContract.find((requirement) => requirement.area === area)!
}

/** Used by future operations until each approved backend operation is mapped. */
export function unsupportedStaffOperation(area: StaffArea): never {
  throw new ApiError(`The staff ${area} API is not configured. NEEDS API CONTRACT.`)
}
