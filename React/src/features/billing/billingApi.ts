import { apiRequest } from '../../shared/api/client'
import type { AppointmentRecord } from '../appointments/appointmentApi'
import type { CustomerRecord } from '../customers/customerApi'
import type { ServiceOption } from '../appointments/appointmentApi'

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'other'

export interface InvoiceLineItem {
  _id?: string
  serviceId?: string
  productId?: string
  quantity: number
  unitPriceMinor: number
  totalMinor: number
  service?: { _id: string; name: string } | null
}

export interface PaymentRecord {
  _id: string
  invoiceId: string
  amountMinor: number
  method: PaymentMethod
  status: 'recorded'
  createdAt?: string
}

export interface InvoiceRecord {
  _id: string
  invoiceNumber: string
  customerId: string
  appointmentId?: string
  lineItems: InvoiceLineItem[]
  subtotalMinor: number
  totalMinor: number
  status: InvoiceStatus
  createdAt?: string
  customer?: { _id: string; displayName: string } | null
  appointment?: Pick<AppointmentRecord, '_id' | 'customerId' | 'serviceId' | 'staffId' | 'date' | 'startTime' | 'endTime' | 'status'> | null
  payments: PaymentRecord[]
}

export interface InvoiceSourceOptions { customers: CustomerRecord[]; services: ServiceOption[]; appointments: AppointmentRecord[] }

export async function getInvoices(accessToken: string) {
  return apiRequest<{ data: InvoiceRecord[] }>({ path: '/api/v1/billing/invoices', method: 'GET', token: accessToken })
}

export async function getInvoice(accessToken: string, id: string) {
  return apiRequest<{ data: InvoiceRecord }>({ path: `/api/v1/billing/invoices/${encodeURIComponent(id)}`, method: 'GET', token: accessToken })
}

export async function getInvoiceSources(accessToken: string): Promise<InvoiceSourceOptions> {
  const [customers, services, appointments] = await Promise.all([
    apiRequest<{ data: CustomerRecord[] }>({ path: '/api/v1/customers?limit=100', method: 'GET', token: accessToken }),
    apiRequest<{ data: ServiceOption[] }>({ path: '/api/v1/services?status=active&limit=100', method: 'GET', token: accessToken }),
    apiRequest<{ data: AppointmentRecord[] }>({ path: '/api/v1/appointments?limit=100', method: 'GET', token: accessToken }),
  ])
  return { customers: customers.data, services: services.data, appointments: appointments.data }
}

export async function createInvoice(accessToken: string, input: { appointmentId: string } | { customerId: string; serviceIds: string[] }) {
  return apiRequest<{ data: InvoiceRecord }>({ path: '/api/v1/billing/invoices', method: 'POST', token: accessToken, body: input })
}

export async function recordPayment(accessToken: string, invoiceId: string, input: { amountMinor: number; method: PaymentMethod }) {
  return apiRequest<{ data: PaymentRecord }>({ path: `/api/v1/billing/invoices/${encodeURIComponent(invoiceId)}/payments`, method: 'POST', token: accessToken, body: input })
}
