import { apiRequest } from '../../shared/api/client'

export type ActiveStatus = 'active' | 'inactive'
export type AttendanceStatus = 'present' | 'absent'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export interface StaffRecord { _id: string; displayName: string; designation?: string; email?: string; phone?: string; status: ActiveStatus }
export interface AvailabilityRecord { _id: string; staffId: string; date: string; startTime: string; endTime: string; status: ActiveStatus }
export interface AttendanceRecord { _id: string; staffId: string; date: string; status: AttendanceStatus; checkIn?: string; checkOut?: string }
export interface LeaveRecord { _id: string; staffId: string; startDate: string; endDate: string; status: LeaveStatus; reason?: string }
export interface ListFilters { search?: string; status?: ActiveStatus; limit?: number }
export interface ResourceList<T> { data: T[]; pagination: { page: number; limit: number; total: number } }

function query(filters: ListFilters = {}) { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'undefined' && value !== 'null') params.set(key, String(value).trim()) }); return params.size ? `?${params}` : '' }
function list<T>(path: string, token: string, filters?: ListFilters) { return apiRequest<ResourceList<T>>({ path: `${path}${query(filters)}`, method: 'GET', token }) }
function create<T>(path: string, token: string, body: unknown) { return apiRequest<{ data: T }>({ path, method: 'POST', token, body }) }
function update<T>(path: string, token: string, id: string, body: unknown) { return apiRequest<{ data: T }>({ path: `${path}/${encodeURIComponent(id)}`, method: 'PATCH', token, body }) }

export const getStaff = (token: string, filters?: ListFilters) => list<StaffRecord>('/api/v1/staff', token, filters)
export const createStaff = (token: string, body: Omit<StaffRecord, '_id'>) => create<StaffRecord>('/api/v1/staff', token, body)
export const updateStaff = (token: string, id: string, body: Partial<Omit<StaffRecord, '_id'>>) => update<StaffRecord>('/api/v1/staff', token, id, body)
export const getAvailability = (token: string) => list<AvailabilityRecord>('/api/v1/staff/availability', token, { limit: 100 })
export const createAvailability = (token: string, body: Omit<AvailabilityRecord, '_id'>) => create<AvailabilityRecord>('/api/v1/staff/availability', token, body)
export const updateAvailability = (token: string, id: string, body: Partial<Omit<AvailabilityRecord, '_id'>>) => update<AvailabilityRecord>('/api/v1/staff/availability', token, id, body)
export const getAttendance = (token: string) => list<AttendanceRecord>('/api/v1/attendance', token, { limit: 100 })
export const createAttendance = (token: string, body: Omit<AttendanceRecord, '_id'>) => create<AttendanceRecord>('/api/v1/attendance', token, body)
export const updateAttendance = (token: string, id: string, body: Partial<Omit<AttendanceRecord, '_id'>>) => update<AttendanceRecord>('/api/v1/attendance', token, id, body)
export const getLeave = (token: string) => list<LeaveRecord>('/api/v1/leave', token, { limit: 100 })
export const createLeave = (token: string, body: Omit<LeaveRecord, '_id'> & { status?: LeaveStatus }) => create<LeaveRecord>('/api/v1/leave', token, body)
export const updateLeave = (token: string, id: string, body: Partial<Omit<LeaveRecord, '_id'>>) => update<LeaveRecord>('/api/v1/leave', token, id, body)
