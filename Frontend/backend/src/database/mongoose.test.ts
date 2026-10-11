import assert from 'node:assert/strict'
import test from 'node:test'
import { connectDatabase, disconnectDatabase, getDatabaseStatus } from './mongoose.js'

test('reports not configured without a MongoDB URI', async () => {
  await disconnectDatabase()

  const status = await connectDatabase(undefined)

  assert.equal(status, 'not_configured')
  assert.equal(getDatabaseStatus(), 'not_configured')
})

test('reports unavailable when an explicitly supplied MongoDB URI cannot be reached', async () => {
  await disconnectDatabase()

  const status = await connectDatabase('mongodb://127.0.0.1:1/salon_saas_test', {
    serverSelectionTimeoutMS: 50,
  })

  assert.equal(status, 'unavailable')
  assert.equal(getDatabaseStatus(), 'unavailable')
})

test('reports connected with an explicitly supplied test database', {
  skip: process.env.MONGODB_TEST_URI ? undefined : 'Set MONGODB_TEST_URI to run this integration test.',
}, async () => {
  await disconnectDatabase()

  const status = await connectDatabase(process.env.MONGODB_TEST_URI)

  assert.equal(status, 'connected')
  await disconnectDatabase()
})
