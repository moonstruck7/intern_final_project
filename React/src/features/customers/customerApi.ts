import { ApiError } from '../../shared/api/ApiError'
import type { CustomerArea } from './customer.types'

export interface CustomerContractRequirement {
  area: CustomerArea
  missing: readonly string[]
}

/**
 * Contract boundary only. Endpoints, HTTP methods, schemas, and permission IDs
 * are absent from the repository and must not be guessed in this feature.
 */
export const customerContract: readonly CustomerContractRequirement[] = [
  { area: 'customers', missing: ['list/create/update/detail endpoints', 'customer request and response schema', 'field validation', 'status values and transitions', 'search/filter/pagination semantics', 'authorization'] },
  { area: 'history', missing: ['customer history endpoint/schema', 'appointment and billing history integration', 'history authorization and pagination behavior'] },
  { area: 'membership', missing: ['membership/loyalty data model', 'tiers, points, pricing, redemption and expiry rules', 'all API operations and authorization'] },
]

export function getCustomerContractRequirement(area: CustomerArea): CustomerContractRequirement {
  return customerContract.find((requirement) => requirement.area === area)!
}

/** Used by future customer actions until the approved operation is mapped. */
export function unsupportedCustomerOperation(area: CustomerArea): never {
  throw new ApiError(`The customer ${area} API is not configured. NEEDS API CONTRACT.`)
}
