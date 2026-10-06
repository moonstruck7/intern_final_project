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
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/billing${path}`, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

test('billing invoices require authentication', async () => {
  assert.equal((await request('/invoices')).status, 401)
})

test('billing invoices reject roles without platform management permission', async () => {
  const manager = await createAccessToken({ userId: 'test-manager', role: 'manager' })
  const customer = await createAccessToken({ userId: 'test-customer', role: 'customer' })
  assert.equal((await request('/invoices', 'GET', manager)).status, 403)
  assert.equal((await request('/invoices', 'GET', customer)).status, 403)
})

test('billing routes validate invoice and invoice-source identifiers after owner authorization', async () => {
  const owner = await createAccessToken({ userId: 'test-owner', role: 'owner' })
  assert.equal((await request('/invoices/not-an-id', 'GET', owner)).status, 400)
  assert.equal((await request('/invoices/not-an-id/payments', 'POST', owner, { amountMinor: 1, method: 'cash' })).status, 400)
  assert.equal((await request('/invoices', 'POST', owner, { appointmentId: 'not-an-id' })).status, 400)
})
