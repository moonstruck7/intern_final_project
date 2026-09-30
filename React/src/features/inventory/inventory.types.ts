/**
 * Canonical inventory boundaries for future B4 reporting. The backend contract
 * determines product fields, stock values, category representation, and all
 * movement relationships; this feature does not duplicate report data.
 */
export type InventoryItemId = string | number
export type InventoryCategoryId = string | number
export type InventoryTransactionId = string | number

export interface InventoryCategoryReference {
  id: InventoryCategoryId
}

export interface InventoryItemReference {
  id: InventoryItemId
  category?: InventoryCategoryReference
}

/** Current-stock representation is contract-dependent; it only identifies its item. */
export interface StockReference {
  item: InventoryItemReference
}

/** Movement fields and any external relationships await the approved API schema. */
export interface InventoryTransactionReference {
  id: InventoryTransactionId
  item: InventoryItemReference
}

/** The backend will determine low-stock rules and the resulting item set. */
export interface LowStockReference {
  item: InventoryItemReference
}

export type InventoryArea = 'products' | 'stock' | 'transactions' | 'history' | 'lowStock'
