import { ApiError } from '../../shared/api/ApiError'
import type { BillingArea } from './billing.types'

export interface BillingContractRequirement {
  area: BillingArea
  missing: readonly string[]
}

/**
 * Contract boundary only. No approved billing endpoints, request schemas, or
 * business rules exist in the repository, so this layer deliberately makes no requests.
 */
export const billingContract: readonly BillingContractRequirement[] = [
  { area: 'pos', missing: ['appointment billing lookup endpoint/schema', 'invoice creation/preview operation', 'approved totals, tax, discount, membership and package rules', 'validation and authorization'] },
  { area: 'invoices', missing: ['invoice list/detail/create/update endpoints', 'invoice and line-item response schema', 'invoice number and status lifecycle', 'document/download behavior', 'search/filter/pagination semantics'] },
  { area: 'payments', missing: ['payment create/list/detail endpoints', 'payment method, transaction, status and partial-payment rules', 'refund/void behavior', 'validation and authorization'] },
  { area: 'history', missing: ['customer/appointment billing-history endpoint/schema', 'invoice-payment relationship response', 'history filtering/pagination and authorization'] },
]

export function getBillingContractRequirement(area: BillingArea): BillingContractRequirement {
  return billingContract.find((requirement) => requirement.area === area)!
}

/** Used by future billing operations until the approved backend operation is mapped. */
export function unsupportedBillingOperation(area: BillingArea): never {
  throw new ApiError(`The billing ${area} API is not configured. NEEDS API CONTRACT.`)
}
