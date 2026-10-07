import { createHash, randomBytes } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { HttpError } from '../shared/errors.js'
import type { Role } from './roles.js'

const encoder = new TextEncoder()

function signingKey() {
  if (!env.jwtAccessSecret) throw new HttpError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.')
  return encoder.encode(env.jwtAccessSecret)
}

export type AuthClaims = { userId: string; role: Role }

export async function createAccessToken(claims: AuthClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(env.accessTokenTtl)
    .sign(signingKey())
}

export async function verifyAccessToken(token: string): Promise<AuthClaims> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ['HS256'] })
    if (!payload.sub || typeof payload.role !== 'string') throw new Error('Invalid claims')
    return { userId: payload.sub, role: payload.role as Role }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.')
  }
}

export function createRefreshToken(): string { return randomBytes(48).toString('base64url') }
export function hashRefreshToken(token: string): string { return createHash('sha256').update(token).digest('hex') }
