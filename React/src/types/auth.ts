/** Opaque until the backend publishes its approved permission identifiers. */
export type Permission = string

export interface SessionUser {
  id: string
  displayName: string
  permissions: Permission[]
}

export interface Session {
  accessToken: string
  user: SessionUser
}
