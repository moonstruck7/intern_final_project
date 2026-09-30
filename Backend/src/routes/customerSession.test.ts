import assert from 'node:assert/strict'
import test from 'node:test'

process.env.JWT_ACCESS_SECRET = 'test-only-access-secret-not-for-deployment'
const { createApp } = await import('../app/createApp.js')
const { createAccessToken } = await import('../auth/tokens.js')

async function request(path: string, method = 'GET', token?: string, body?: unknown) {
  const server = createApp().listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No TCP test address.')
  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/customer${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

test('customer contract routes require authentication', async () => {
  assert.equal((await request('/me/appointments', 'POST', undefined, {})).status, 401)
})

test('non-customer users cannot use customer booking', async () => {
  const token = await createAccessToken({ userId: 'test-owner', role: 'owner' })
  assert.equal((await request('/me/appointments', 'POST', token, {})).status, 403)
})

test('malformed customer token subjects are safely rejected before a User lookup', async () => {
  const token = await createAccessToken({ userId: 'test-customer', role: 'customer' })
  assert.equal((await request('/me/appointments', 'POST', token, { serviceId: 'bad', staffId: 'bad', date: '2026-10-01', startTime: '10:00' })).status, 403)
})
