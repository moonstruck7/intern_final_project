import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from '../config/env.js'
import { errorHandler, apiNotFound } from '../middleware/errorHandler.js'
import { requestLogger } from '../middleware/requestLogger.js'
import { healthRouter } from '../routes/health.js'
import { authRouter } from '../routes/auth.js'
import { domainRouter } from '../routes/domains.js'
import { appointmentRouter } from '../appointments/routes.js'
import { billingRouter } from '../billing/routes.js'
import { inventoryRouter } from '../inventory/routes.js'
import { insightsRouter } from '../insights/routes.js'
import { customerSessionRouter } from '../routes/customerSession.js'
import { customerDiscoveryRouter } from '../routes/customerDiscovery.js'
import { customerHistoryRouter } from '../routes/customerHistory.js'
import { Service } from '../domains/models.js'

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
  app.get(`${env.apiPrefix}/catalog/services`, async (_request, response, next) => {
    try { response.json({ data: await Service.find({ status: 'active' }).sort({ name: 1 }).limit(100) }) } catch (error) { next(error) }
  })
  app.use(`${env.apiPrefix}/customers`, customerHistoryRouter)
  app.use(env.apiPrefix, domainRouter)
  app.use(`${env.apiPrefix}/appointments`, appointmentRouter)
  app.use(`${env.apiPrefix}/billing`, billingRouter)
  app.use(`${env.apiPrefix}/inventory`, inventoryRouter)
  app.use(env.apiPrefix, insightsRouter)
  app.use(`${env.apiPrefix}/customer`, customerSessionRouter)
  app.use(`${env.apiPrefix}/customer`, customerDiscoveryRouter)
  app.use(env.apiPrefix, apiNotFound)
  app.use(errorHandler)

  return app
}
