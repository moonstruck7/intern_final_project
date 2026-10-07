import type { RequestHandler } from 'express'
import { hasPermissions, type Permission } from '../auth/roles.js'
import { verifyAccessToken } from '../auth/tokens.js'
import { HttpError } from '../shared/errors.js'

export const requireAuthentication: RequestHandler = async (request, _response, next) => {
  const header = request.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.'))
  try { request.auth = await verifyAccessToken(token); next() } catch (error) { next(error) }
}

export function requirePermissions(...required: Permission[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.'))
    if (!hasPermissions(request.auth.role, required)) return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission for this operation.'))
    next()
  }
}
