import type { AuthClaims } from '../auth/tokens.js'

declare global {
  namespace Express { interface Request { auth?: AuthClaims } }
}

export {}
