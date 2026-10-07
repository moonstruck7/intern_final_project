import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../app/createApp.js'
import { disconnectDatabase } from '../database/mongoose.js'

test('health reports a database as not configured when no connection has been requested', async () => {
  await disconnectDatabase()
  const app = createApp()
  const server = app.listen(0)

  try {
    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('The test server did not expose a TCP address.')
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`)

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), {
      status: 'ok',
      dependencies: { database: 'not_configured' },
    })
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
})
