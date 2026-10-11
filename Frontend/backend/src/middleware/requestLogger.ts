import type { RequestHandler } from 'express'
import { env } from '../config/env.js'

/** Development-only request metadata; it never logs request bodies or headers. */
export const requestLogger: RequestHandler = (request, response, next) => {
  if (env.nodeEnv !== 'development') return next()

  const startedAt = performance.now()
  response.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAt)
    console.info(`${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`)
  })
  next()
}
