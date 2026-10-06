import { apiRequest } from '../../shared/api/client'

export const appointmentStatuses = ['scheduled', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'] as const
export type AppointmentStatus = (typeof appointmentStatuses)[number]

export interface AppointmentRecord {
  _id: string
  customerId: string
  serviceId: string
  staffId: string
  date: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  createdAt?: string
  updatedAt?: string
}

export interface CustomerOption { _id: string; displayName: string; email?: string; phone?: string }
export interface ServiceOption { _id: string; name: string; durationMinutes: number; price: number; status: 'active' | 'inactive' }
export interface StaffOption { _id: string; displayName: string; designation?: string; status: 'active' | 'inactive' }
export interface AvailabilityOption { _id: string; staffId: string; date: string; startTime: string; endTime: string; status: 'active' | 'inactive' }

export interface AppointmentFilters {
  date?: string
  startDate?: string
  endDate?: string
  staffId?: string
  customerId?: string
  serviceId?: string
  status?: AppointmentStatus
}

export interface AppointmentInput {
  customerId: string
  serviceId: string
  staffId: string
  date: string
  startTime: string
  status?: AppointmentStatus
}

function queryString(values: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== 'undefined' && value !== 'null' && value.trim() !== '') {
      query.set(key, value.trim())
    }
  })
  const result = query.toString()
  return result ? `?${result}` : ''
}

export async function getAppointments(accessToken: string, filters: AppointmentFilters = {}) {
  const response = await apiRequest<{ data: AppointmentRecord[]; pagination: { page: number; limit: number; total: number } }>({
    path: `/api/v1/appointments${queryString({ ...filters, limit: '100' })}`,
    method: 'GET',
    token: accessToken,
  })
  return response
}

export async function getQueue(accessToken: string) {
  return apiRequest<{ data: AppointmentRecord[] }>({ path: '/api/v1/appointments/queue/today', method: 'GET', token: accessToken })
}

export async function getAppointmentOptions(accessToken: string) {
  const [customers, services, staff, availability] = await Promise.all([
    apiRequest<{ data: CustomerOption[] }>({ path: '/api/v1/customers?status=active&limit=100', method: 'GET', token: accessToken }),
    apiRequest<{ data: ServiceOption[] }>({ path: '/api/v1/services?status=active&limit=100', method: 'GET', token: accessToken }),
    apiRequest<{ data: StaffOption[] }>({ path: '/api/v1/staff?status=active&limit=100', method: 'GET', token: accessToken }),
    apiRequest<{ data: AvailabilityOption[] }>({ path: '/api/v1/staff/availability?status=active&limit=100', method: 'GET', token: accessToken }),
  ])
  return { customers: customers.data, services: services.data, staff: staff.data, availability: availability.data }
}

export async function createAppointment(accessToken: string, input: AppointmentInput) {
  return apiRequest<{ data: AppointmentRecord }>({ path: '/api/v1/appointments', method: 'POST', token: accessToken, body: input })
}

export async function updateAppointment(accessToken: string, id: string, input: Partial<AppointmentInput>) {
  return apiRequest<{ data: AppointmentRecord }>({ path: `/api/v1/appointments/${encodeURIComponent(id)}`, method: 'PATCH', token: accessToken, body: input })
}
