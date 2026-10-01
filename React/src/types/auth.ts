/** Opaque until the backend publishes its approved permission identifiers. */
export type Permission = string

export interface SessionUser {
  id: string
  displayName: string
  loginIdentifier?: string
  roles?: string[]
  permissions: Permission[]
}

export interface Session {
  accessToken: string
  refreshToken: string
  refreshExpiresAt: string
  user: SessionUser
}
