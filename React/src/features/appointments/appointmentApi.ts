import { ApiError } from '../../shared/api/ApiError'
import type { AppointmentArea } from './appointment.types'

export interface AppointmentContractRequirement {
  area: AppointmentArea
  missing: readonly string[]
}

/**
 * Contract boundary only. Paths, methods, schemas, lifecycle states, and query
 * semantics are intentionally absent until the shared backend API is approved.
 */
export const appointmentContract: readonly AppointmentContractRequirement[] = [
  { area: 'appointments', missing: ['list/detail/create/update endpoints', 'appointment request and response schema', 'customer/service/staff lookup contracts', 'date/time representation', 'validation', 'status values and transitions', 'cancellation operation and business rules', 'search/filter/pagination semantics', 'authorization'] },
  { area: 'scheduling', missing: ['calendar/scheduling query schema', 'staff availability lookup endpoint/schema', 'available-slot representation', 'timezone and rescheduling rules', 'staff-service capability relationship'] },
  { area: 'queue', missing: ['queue entry endpoint/schema', 'appointment-to-queue relationship', 'queue lifecycle/status rules', 'walk-in, priority and estimated-wait rules', 'authorization'] },
]

export function getAppointmentContractRequirement(area: AppointmentArea): AppointmentContractRequirement {
  return appointmentContract.find((requirement) => requirement.area === area)!
}

/** Used by future appointment actions until the approved backend operation is mapped. */
export function unsupportedAppointmentOperation(area: AppointmentArea): never {
  throw new ApiError(`The appointment ${area} API is not configured. NEEDS API CONTRACT.`)
}
