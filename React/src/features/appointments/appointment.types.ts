import type { CustomerReference } from '../customers/customer.types'
import type { ServiceReference } from '../services/serviceCatalog.types'
import type { StaffAvailabilityReference, StaffReference } from '../staff/staff.types'

/**
 * Canonical appointment relationship model. The server contract will decide
 * whether these are returned as IDs, nested objects, or another representation.
 */
export type AppointmentId = string | number

export interface AppointmentReference {
  id: AppointmentId
  customer: CustomerReference
  service: ServiceReference
  staff: StaffReference
}

/** A3's availability dependency comes from B2, never an appointment-local type. */
export type AppointmentAvailability = StaffAvailabilityReference

export type AppointmentArea = 'appointments' | 'scheduling' | 'queue'
