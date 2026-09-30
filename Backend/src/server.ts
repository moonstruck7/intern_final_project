import { createApp } from './app/createApp.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.port, () => {
  console.info(`Salon SaaS API foundation listening on port ${env.port}.`)
})
