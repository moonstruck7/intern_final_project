import { createApp } from './app/createApp.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './database/mongoose.js'

const app = createApp()

async function startServer() {
  const databaseStatus = await connectDatabase()

  if (databaseStatus === 'connected') {
    console.info('MongoDB connection established.')
  } else if (databaseStatus === 'not_configured') {
    console.info('MongoDB is not configured. Starting the API without database readiness.')
  } else if (databaseStatus === 'unavailable') {
    console.warn('MongoDB is unavailable. Starting the API without database readiness.')
  }

  const server = app.listen(env.port, () => {
    console.info(`Salon SaaS API foundation listening on port ${env.port}.`)
  })

  const shutdown = async (signal: string) => {
    console.info(`Received ${signal}; shutting down.`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
}

void startServer()
