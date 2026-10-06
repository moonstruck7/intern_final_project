import { apiRequest } from '../../shared/api/client'

export type CatalogStatus = 'active' | 'inactive'
export interface CategoryRecord { _id: string; name: string; status: CatalogStatus }
export interface ServiceRecord { _id: string; name: string; categoryId: string; price: number; durationMinutes: number; status: CatalogStatus }
export interface PackageRecord { _id: string; name: string; serviceIds: string[]; status: CatalogStatus }
export interface CatalogFilters { search?: string; status?: CatalogStatus; page?: number; limit?: number }
export interface CatalogList<T> { data: T[]; pagination: { page: number; limit: number; total: number } }

function query(filters: CatalogFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'undefined' && value !== 'null') {
      params.set(key, String(value).trim())
    }
  })
  return params.size ? `?${params}` : ''
}

function list<T>(path: string, accessToken: string, filters?: CatalogFilters) { return apiRequest<CatalogList<T>>({ path: `${path}${query(filters)}`, method: 'GET', token: accessToken }) }
function create<T>(path: string, accessToken: string, body: unknown) { return apiRequest<{ data: T }>({ path, method: 'POST', token: accessToken, body }) }
function update<T>(path: string, accessToken: string, id: string, body: unknown) { return apiRequest<{ data: T }>({ path: `${path}/${encodeURIComponent(id)}`, method: 'PATCH', token: accessToken, body }) }

export const getCategories = (token: string, filters?: CatalogFilters) => list<CategoryRecord>('/api/v1/service-categories', token, filters)
export const createCategory = (token: string, body: Pick<CategoryRecord, 'name' | 'status'>) => create<CategoryRecord>('/api/v1/service-categories', token, body)
export const updateCategory = (token: string, id: string, body: Partial<Pick<CategoryRecord, 'name' | 'status'>>) => update<CategoryRecord>('/api/v1/service-categories', token, id, body)
export const getServices = (token: string, filters?: CatalogFilters) => list<ServiceRecord>('/api/v1/services', token, filters)
export const createService = (token: string, body: Omit<ServiceRecord, '_id'>) => create<ServiceRecord>('/api/v1/services', token, body)
export const updateService = (token: string, id: string, body: Partial<Omit<ServiceRecord, '_id'>>) => update<ServiceRecord>('/api/v1/services', token, id, body)
export const getPackages = (token: string, filters?: CatalogFilters) => list<PackageRecord>('/api/v1/packages', token, filters)
export const createPackage = (token: string, body: Omit<PackageRecord, '_id'>) => create<PackageRecord>('/api/v1/packages', token, body)
export const updatePackage = (token: string, id: string, body: Partial<Omit<PackageRecord, '_id'>>) => update<PackageRecord>('/api/v1/packages', token, id, body)
