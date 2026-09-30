import { ApiError } from '../../shared/api/ApiError'
import type { ServiceCatalogArea } from './serviceCatalog.types'

export interface ServiceCatalogContractRequirement {
  area: ServiceCatalogArea
  missing: readonly string[]
}

/**
 * Contract boundary only. Do not add endpoint paths, HTTP methods, or request
 * mappings here until the backend team approves them. API calls stay out of UI.
 */
export const serviceCatalogContract: readonly ServiceCatalogContractRequirement[] = [
  { area: 'categories', missing: ['list/create/update endpoint', 'request and response schema', 'status behavior', 'search/filter semantics', 'authorization'] },
  { area: 'services', missing: ['list/create/update endpoint', 'category lookup schema', 'price and duration representation', 'status values', 'search/filter semantics', 'authorization'] },
  { area: 'packages', missing: ['package data model', 'composition rules', 'pricing rules', 'redemption/expiry lifecycle', 'all API operations and authorization'] },
]

export function getCatalogContractRequirement(area: ServiceCatalogArea): ServiceCatalogContractRequirement {
  return serviceCatalogContract.find((requirement) => requirement.area === area)!
}

/** Used by future forms/actions until each backend operation is contract-mapped. */
export function unsupportedCatalogOperation(area: ServiceCatalogArea): never {
  throw new ApiError(`The ${area} API is not configured. NEEDS API CONTRACT.`)
}
