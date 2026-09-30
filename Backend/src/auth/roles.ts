export const roles = ['owner', 'manager', 'staff'] as const
export type Role = (typeof roles)[number]

// Implementation decision: names and permission identifiers are not specified
// by the supplied project contract. Keep this initial registry centralized.
export const permissions = ['dashboard.read', 'platform.manage', 'customers.manage', 'services.manage', 'staff.manage', 'appointments.manage', 'queue.manage', 'reports.read', 'marketing.manage', 'notifications.manage'] as const
export type Permission = (typeof permissions)[number]

const rolePermissions: Record<Role, readonly Permission[]> = {
  owner: permissions,
  manager: ['dashboard.read', 'customers.manage', 'services.manage', 'staff.manage', 'appointments.manage', 'queue.manage', 'reports.read', 'marketing.manage', 'notifications.manage'],
  staff: ['dashboard.read'],
}

export function hasPermissions(role: Role, required: readonly Permission[]): boolean {
  return required.every((permission) => rolePermissions[role].includes(permission))
}
