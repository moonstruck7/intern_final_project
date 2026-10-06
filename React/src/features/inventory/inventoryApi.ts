import { apiRequest } from '../../shared/api/client'

export type ProductStatus = 'active' | 'inactive'
export type StockMovementType = 'stock_in' | 'stock_out' | 'adjustment'

export interface ProductRecord {
  _id: string
  name: string
  sku: string
  sellingPriceMinor: number
  currentStock: number
  lowStockThreshold?: number
  status: ProductStatus
  createdAt?: string
  updatedAt?: string
}

export interface StockTransactionRecord {
  _id: string
  productId: string
  type: StockMovementType
  quantity: number
  reason?: string
  actorId?: string
  createdAt: string
  updatedAt?: string
}

export interface ProductFilters {
  status?: ProductStatus
  search?: string
  lowStock?: 'true' | 'false'
}

export interface CreateProductInput {
  name: string
  sku: string
  sellingPriceMinor: number
  lowStockThreshold?: number
  status?: ProductStatus
}

export interface UpdateProductInput {
  name?: string
  sku?: string
  sellingPriceMinor?: number
  lowStockThreshold?: number
  status?: ProductStatus
}

export interface StockMovementInput {
  type: StockMovementType
  quantity: number
  reason?: string
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

export async function getProducts(accessToken: string, filters: ProductFilters = {}) {
  return apiRequest<{ data: ProductRecord[] }>({
    path: `/api/v1/inventory/products${queryString({ ...filters })}`,
    method: 'GET',
    token: accessToken,
  })
}

export async function getProduct(accessToken: string, id: string) {
  return apiRequest<{ data: ProductRecord }>({
    path: `/api/v1/inventory/products/${encodeURIComponent(id)}`,
    method: 'GET',
    token: accessToken,
  })
}

export async function createProduct(accessToken: string, input: CreateProductInput) {
  return apiRequest<{ data: ProductRecord }>({
    path: '/api/v1/inventory/products',
    method: 'POST',
    token: accessToken,
    body: input,
  })
}

export async function updateProduct(accessToken: string, id: string, input: UpdateProductInput) {
  return apiRequest<{ data: ProductRecord }>({
    path: `/api/v1/inventory/products/${encodeURIComponent(id)}`,
    method: 'PATCH',
    token: accessToken,
    body: input,
  })
}

export async function recordStockMovement(accessToken: string, productId: string, input: StockMovementInput) {
  return apiRequest<{ data: StockTransactionRecord; currentStock: number }>({
    path: `/api/v1/inventory/products/${encodeURIComponent(productId)}/stock`,
    method: 'POST',
    token: accessToken,
    body: input,
  })
}

export async function getProductTransactions(accessToken: string, productId: string) {
  return apiRequest<{ data: StockTransactionRecord[] }>({
    path: `/api/v1/inventory/products/${encodeURIComponent(productId)}/transactions`,
    method: 'GET',
    token: accessToken,
  })
}

export async function getAllTransactions(accessToken: string) {
  return apiRequest<{ data: StockTransactionRecord[] }>({
    path: '/api/v1/inventory/transactions',
    method: 'GET',
    token: accessToken,
  })
}
