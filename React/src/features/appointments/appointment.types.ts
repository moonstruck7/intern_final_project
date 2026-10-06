import type { CustomerReference } from '../customers/customer.types'
import type { ServiceReference } from '../services/serviceCatalog.types'
import type { StaffReference } from '../staff/staff.types'

export type AppointmentId = string

/** Shared relationship reference retained for downstream billing/report types. */
export interface AppointmentReference {
  id: AppointmentId
  customer: CustomerReference
  service: ServiceReference
  staff: StaffReference
}
