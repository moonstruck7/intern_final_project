/**
 * Canonical customer reference for future appointment and billing integrations.
 * Exact identity, contact, status, and profile fields must be mapped from the
 * approved shared backend contract; no customer data is duplicated in A3/A4.
 */
export type CustomerId = string | number

export interface CustomerReference {
  id: CustomerId
  displayName?: string
  status?: unknown
}

/** Placeholder type boundary for an API-backed profile once its schema is known. */
export type CustomerProfile = CustomerReference

export type CustomerArea = 'customers' | 'history' | 'membership'
