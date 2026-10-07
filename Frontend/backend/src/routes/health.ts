import { Router } from 'express'
import { getDatabaseStatus } from '../database/mongoose.js'

export const healthRouter = Router()

healthRouter.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    dependencies: {
      database: getDatabaseStatus(),
    },
  })
})
