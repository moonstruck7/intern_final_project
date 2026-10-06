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
    return await fetch(`http://127.0.0.1:${address.port}/api/v1${path}`, {
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

test('report, marketing, and notification routes require authentication', async () => {
  assert.equal((await request('/analytics/summary')).status, 401)
  assert.equal((await request('/reports/invoices')).status, 401)
  assert.equal((await request('/reports/operations')).status, 401)
  assert.equal((await request('/insights/trends')).status, 401)
  assert.equal((await request('/marketing/campaigns')).status, 401)
  assert.equal((await request('/notifications')).status, 401)
})

test('report, marketing, and notification routes reject unauthorized roles', async () => {
  const staff = await createAccessToken({ userId: 'test-staff', role: 'staff' })
  const customer = await createAccessToken({ userId: 'test-customer', role: 'customer' })

  assert.equal((await request('/analytics/summary', 'GET', staff)).status, 403)
  assert.equal((await request('/reports/invoices', 'GET', staff)).status, 403)
  assert.equal((await request('/marketing/campaigns', 'GET', staff)).status, 403)
  assert.equal((await request('/marketing/campaigns', 'POST', staff, { name: 'Promo' })).status, 403)
  assert.equal((await request('/notifications', 'GET', staff)).status, 403)

  assert.equal((await request('/analytics/summary', 'GET', customer)).status, 403)
  assert.equal((await request('/reports/invoices', 'GET', customer)).status, 403)
  assert.equal((await request('/marketing/campaigns', 'GET', customer)).status, 403)
  assert.equal((await request('/notifications', 'GET', customer)).status, 403)
})

test('insights and marketing routes validate query parameters and identifiers', async () => {
  const manager = await createAccessToken({ userId: 'test-manager', role: 'manager' })

  // Invalid date range (startDate > endDate)
  assert.equal((await request('/insights/trends?startDate=2026-10-10&endDate=2026-10-01', 'GET', manager)).status, 400)

  // Invalid campaign id
  assert.equal((await request('/marketing/campaigns/not-an-id', 'PATCH', manager, { status: 'active' })).status, 400)

  // Invalid notification id
  assert.equal((await request('/notifications/not-an-id/read', 'PATCH', manager)).status, 400)

  // Empty campaign name
  assert.equal((await request('/marketing/campaigns', 'POST', manager, { name: '' })).status, 400)
})
