import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { HttpError } from '../shared/errors.js'

export const apiNotFound: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, 'NOT_FOUND', `No API route matches ${request.method} ${request.originalUrl}.`))
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload or parameters.' } })
    return
  }

  const knownError = error instanceof HttpError
  const status = knownError ? error.status : 500
  const code = knownError ? error.code : 'INTERNAL_ERROR'
  const message = knownError ? error.message : 'An unexpected error occurred.'

  if (!knownError && env.nodeEnv !== 'production') {
    console.error(error)
  }

  response.status(status).json({ error: { code, message } })
}
