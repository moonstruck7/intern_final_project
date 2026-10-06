import assert from 'node:assert/strict'
import test from 'node:test'

process.env.JWT_ACCESS_SECRET = 'test-only-access-secret-not-for-deployment'
const { createApp } = await import('../app/createApp.js')
const { createAccessToken } = await import('../auth/tokens.js')

async function request(path: string, token?: string) {
  const server = createApp().listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No TCP test address.')
  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/customers${path}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

test('customer CRM history requires authentication', async () => {
  const response = await request('/507f1f77bcf86cd799439011/history')
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } })
})

test('customer CRM history rejects roles without customer-management permission', async () => {
  const customerToken = await createAccessToken({ userId: 'test-customer', role: 'customer' })
  const staffToken = await createAccessToken({ userId: 'test-staff', role: 'staff' })
  assert.equal((await request('/507f1f77bcf86cd799439011/history', customerToken)).status, 403)
  assert.equal((await request('/507f1f77bcf86cd799439011/history', staffToken)).status, 403)
})

test('customer CRM history accepts existing authorized roles before data access', async () => {
  const ownerToken = await createAccessToken({ userId: 'test-owner', role: 'owner' })
  const managerToken = await createAccessToken({ userId: 'test-manager', role: 'manager' })
  assert.equal((await request('/not-an-id/history', ownerToken)).status, 400)
  assert.equal((await request('/not-an-id/history', managerToken)).status, 400)
})
