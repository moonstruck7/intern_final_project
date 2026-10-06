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
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/inventory${path}`, {
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

test('inventory routes require authentication', async () => {
  assert.equal((await request('/products')).status, 401)
  assert.equal((await request('/products', 'POST', undefined, {})).status, 401)
  assert.equal((await request('/transactions')).status, 401)
})

test('inventory routes reject unauthorized roles without platform management permission', async () => {
  const manager = await createAccessToken({ userId: 'test-manager', role: 'manager' })
  const staff = await createAccessToken({ userId: 'test-staff', role: 'staff' })
  const customer = await createAccessToken({ userId: 'test-customer', role: 'customer' })

  assert.equal((await request('/products', 'GET', manager)).status, 403)
  assert.equal((await request('/products', 'GET', staff)).status, 403)
  assert.equal((await request('/products', 'GET', customer)).status, 403)
  assert.equal((await request('/products', 'POST', manager, {})).status, 403)
})

test('inventory routes validate identifiers and payloads for authorized roles', async () => {
  const owner = await createAccessToken({ userId: 'test-owner', role: 'owner' })

  assert.equal((await request('/products/not-an-id', 'GET', owner)).status, 400)
  assert.equal((await request('/products/not-an-id', 'PATCH', owner, { name: 'Updated' })).status, 400)
  assert.equal((await request('/products/not-an-id/stock', 'POST', owner, { type: 'stock_in', quantity: 5 })).status, 400)
  assert.equal((await request('/products/not-an-id/transactions', 'GET', owner)).status, 400)

  assert.equal((await request('/products', 'POST', owner, { name: '' })).status, 400)
  assert.equal((await request('/products', 'POST', owner, { name: 'Shampoo', sku: 'SKU1', sellingPriceMinor: -100 })).status, 400)
})
