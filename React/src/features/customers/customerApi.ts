import { apiRequest } from '../../shared/api/client'

export type CustomerStatus = 'active' | 'inactive'

export interface CustomerRecord {
  _id: string
  displayName: string
  email?: string
  phone?: string
  notes?: string
  status: CustomerStatus
  createdAt?: string
  updatedAt?: string
}

export interface CustomerInput {
  displayName: string
  email?: string
  phone?: string
  notes?: string
  status?: CustomerStatus
}

export interface CustomerAccount {
  id: string
  loginIdentifier: string
  isActive: boolean
  roles: string[]
  customerId: string
}

export interface CustomerAppointment {
  _id: string
  serviceId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
}

export interface CustomerHistoryService { _id: string; name: string }
export interface CustomerHistoryStaff { _id: string; displayName: string; designation?: string }
export interface CustomerPayment { _id: string; invoiceId: string; amountMinor: number; method: 'cash' | 'card' | 'upi' | 'other'; status: 'recorded'; createdAt?: string }
export interface CustomerInvoice { _id: string; invoiceNumber: string; appointmentId?: string; totalMinor: number; subtotalMinor: number; status: 'draft' | 'issued' | 'paid' | 'cancelled'; createdAt?: string; payments: CustomerPayment[] }

export interface CustomerHistory {
  customer: CustomerRecord
  account: CustomerAccount | null
  appointments: CustomerAppointment[]
  services: CustomerHistoryService[]
  staff: CustomerHistoryStaff[]
  invoices: CustomerInvoice[]
}

export interface CustomerListFilters { page?: number; limit?: number; search?: string; status?: CustomerStatus }

function queryString(values: CustomerListFilters) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'undefined' && value !== 'null') {
      query.set(key, String(value).trim())
    }
  })
  const result = query.toString()
  return result ? `?${result}` : ''
}

export async function getCustomers(accessToken: string, filters: CustomerListFilters) {
  return apiRequest<{ data: CustomerRecord[]; pagination: { page: number; limit: number; total: number } }>({ path: `/api/v1/customers${queryString(filters)}`, method: 'GET', token: accessToken })
}

export async function createCustomer(accessToken: string, input: CustomerInput) {
  return apiRequest<{ data: CustomerRecord }>({ path: '/api/v1/customers', method: 'POST', token: accessToken, body: input })
}

export async function updateCustomer(accessToken: string, id: string, input: Partial<CustomerInput>) {
  return apiRequest<{ data: CustomerRecord }>({ path: `/api/v1/customers/${encodeURIComponent(id)}`, method: 'PATCH', token: accessToken, body: input })
}

export async function getCustomerHistory(accessToken: string, id: string) {
  return apiRequest<{ data: CustomerHistory }>({ path: `/api/v1/customers/${encodeURIComponent(id)}/history`, method: 'GET', token: accessToken })
}
