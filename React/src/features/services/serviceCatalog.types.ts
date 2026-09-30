/**
 * Canonical frontend reference for the service entity consumed by appointments
 * and billing. Field names and value formats need mapping to the approved API.
 * No frontend module should maintain a separate service dataset.
 */
export interface ServiceReference {
  id: string
  name: string
  categoryId?: string
  price?: unknown
  duration?: unknown
  status?: unknown
}

/** Minimal category reference for service selection once the API is agreed. */
export interface ServiceCategoryReference {
  id: string
  name: string
  status?: unknown
}

/**
 * Package behavior is intentionally undefined until approved requirements cover
 * its composition, pricing, redemption, expiry, and lifecycle rules.
 */
export interface ServicePackageReference {
  id: string
  name: string
}

export type ServiceCatalogArea = 'services' | 'categories' | 'packages'
