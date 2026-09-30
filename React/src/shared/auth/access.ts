import type { Permission } from '../../types/auth'

/**
 * Modules can declare access requirements here when the shared API publishes
 * the real permission identifiers. Frontend checks improve UX only; the API
 * remains the security authority.
 */
export interface AccessRequirement {
  permissions?: readonly Permission[]
}

export function isAllowed(requirement: AccessRequirement | undefined, permissions: readonly Permission[]): boolean {
  if (!requirement?.permissions?.length) return true
  return requirement.permissions.every((permission) => permissions.includes(permission))
}
