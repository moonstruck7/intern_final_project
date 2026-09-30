import { Router } from 'express'

export const healthRouter = Router()

/** Application health only. No database connection is configured in Part 2. */
healthRouter.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    dependencies: {
      database: 'not_configured',
    },
  })
})
