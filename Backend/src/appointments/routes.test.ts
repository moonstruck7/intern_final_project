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
    const isGet = method.toUpperCase() === 'GET'
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/appointments${path}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body && !isGet ? { 'content-type': 'application/json' } : {}),
      },
      ...(body && !isGet ? { body: JSON.stringify(body) } : {}),
    })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

test('appointment and queue routes require authentication', async () => {
  assert.equal((await request('/')).status, 401)
  assert.equal((await request('/queue/today')).status, 401)
  assert.equal((await request('/', 'POST', undefined, {})).status, 401)
  assert.equal((await request('/507f1f77bcf86cd799439011')).status, 401)
  assert.equal((await request('/507f1f77bcf86cd799439011', 'PATCH', undefined, {})).status, 401)
})

test('appointment and queue routes reject unauthorized roles', async () => {
  const staff = await createAccessToken({ userId: 'test-staff', role: 'staff' })
  const customer = await createAccessToken({ userId: 'test-customer', role: 'customer' })

  assert.equal((await request('/', 'GET', staff)).status, 403)
  assert.equal((await request('/queue/today', 'GET', staff)).status, 403)
  assert.equal((await request('/', 'POST', staff, {})).status, 403)

  assert.equal((await request('/', 'GET', customer)).status, 403)
  assert.equal((await request('/queue/today', 'GET', customer)).status, 403)
  assert.equal((await request('/', 'POST', customer, {})).status, 403)
})

test('appointment routes validate identifiers and payloads for authorized roles', async () => {
  const manager = await createAccessToken({ userId: 'test-manager', role: 'manager' })

  assert.equal((await request('/not-an-id', 'GET', manager)).status, 400)
  assert.equal((await request('/not-an-id', 'PATCH', manager, { status: 'arrived' })).status, 400)
  assert.equal((await request('/', 'POST', manager, { customerId: 'not-valid' })).status, 400)
  assert.equal((await request('/', 'POST', manager, {
    customerId: '507f1f77bcf86cd799439011',
    serviceId: '507f1f77bcf86cd799439012',
    staffId: '507f1f77bcf86cd799439013',
    date: 'invalid-date',
    startTime: '99:99',
  })).status, 400)
})
