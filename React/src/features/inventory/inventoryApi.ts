import { ApiError } from '../../shared/api/ApiError'
import type { InventoryArea } from './inventory.types'

export interface InventoryContractRequirement {
  area: InventoryArea
  missing: readonly string[]
}

/**
 * Contract boundary only. The repository does not define inventory endpoints,
 * schemas, stock business rules, supplier behavior, or authorization IDs.
 */
export const inventoryContract: readonly InventoryContractRequirement[] = [
  { area: 'products', missing: ['product/item and category list/detail/create/update endpoints', 'item/category request and response schema', 'supplier relationship only if approved', 'field validation', 'search/filter/pagination semantics', 'authorization'] },
  { area: 'stock', missing: ['current-stock endpoint/schema', 'stock-in and stock-out operations', 'stock adjustment support and validation', 'stock quantity and negative-stock rules', 'authorization'] },
  { area: 'transactions', missing: ['stock-transaction endpoint/schema', 'movement types/statuses', 'approved relationships to staff, suppliers, appointments, invoices, customers or reasons', 'search/filter/pagination semantics'] },
  { area: 'history', missing: ['inventory-history endpoint/schema', 'item/stock/transaction relationship data', 'history filtering/pagination and authorization'] },
  { area: 'lowStock', missing: ['low-stock endpoint/schema', 'backend-owned threshold and identification rules', 'warning/notification behavior and authorization'] },
]

export function getInventoryContractRequirement(area: InventoryArea): InventoryContractRequirement {
  return inventoryContract.find((requirement) => requirement.area === area)!
}

/** Used by future inventory operations until the approved backend operation is mapped. */
export function unsupportedInventoryOperation(area: InventoryArea): never {
  throw new ApiError(`The inventory ${area} API is not configured. NEEDS API CONTRACT.`)
}
