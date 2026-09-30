import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from '../config/env.js'
import { errorHandler, apiNotFound } from '../middleware/errorHandler.js'
import { requestLogger } from '../middleware/requestLogger.js'
import { healthRouter } from '../routes/health.js'
import { authRouter } from '../routes/auth.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(requestLogger)

  if (env.corsOrigin) {
    app.use(cors({ origin: env.corsOrigin }))
  }

  app.use(env.apiPrefix, healthRouter)
  app.use(`${env.apiPrefix}/auth`, authRouter)
  app.use(env.apiPrefix, apiNotFound)
  app.use(errorHandler)

  return app
}
