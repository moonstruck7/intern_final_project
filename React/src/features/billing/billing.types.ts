import type { AppointmentReference } from '../appointments/appointment.types'
import type { CustomerReference } from '../customers/customer.types'
import type { ServiceReference } from '../services/serviceCatalog.types'
import type { StaffReference } from '../staff/staff.types'

/**
 * Contract-ready billing relationships. The backend contract will decide actual
 * field names, nesting, monetary representation, and invoice/payment states.
 */
export type InvoiceId = string | number
export type PaymentId = string | number

export interface InvoiceLineItemReference {
  service: ServiceReference
}

export interface InvoiceReference {
  id: InvoiceId
  appointment: AppointmentReference
  customer: CustomerReference
  lineItems: readonly InvoiceLineItemReference[]
  staff?: StaffReference
}

/** Payment relationship only; method, amount, status, and gateway fields are contract-dependent. */
export interface PaymentReference {
  id: PaymentId
  invoiceId: InvoiceId
}

export type BillingArea = 'pos' | 'invoices' | 'payments' | 'history'
