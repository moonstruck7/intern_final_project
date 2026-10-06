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
    return await fetch(`http://127.0.0.1:${address.port}/api/v1${path}`, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

test('service and staff domain routes require authentication', async () => {
  assert.equal((await request('/services')).status, 401)
  assert.equal((await request('/staff')).status, 401)
  assert.equal((await request('/attendance')).status, 401)
})

test('staff role cannot use service or staff management routes', async () => {
  const token = await createAccessToken({ userId: 'test-staff', role: 'staff' })
  assert.equal((await request('/services', 'GET', token)).status, 403)
  assert.equal((await request('/staff', 'GET', token)).status, 403)
  assert.equal((await request('/staff/availability', 'GET', token)).status, 403)
})

test('authorized management routes validate identifiers and request bodies', async () => {
  const owner = await createAccessToken({ userId: 'test-owner', role: 'owner' })
  const manager = await createAccessToken({ userId: 'test-manager', role: 'manager' })
  assert.equal((await request('/services/not-an-id', 'GET', manager)).status, 400)
  assert.equal((await request('/staff/not-an-id', 'PATCH', manager, { displayName: 'Updated' })).status, 400)
  assert.equal((await request('/service-categories', 'POST', manager, { name: '' })).status, 400)
  assert.equal((await request('/staff/availability', 'POST', owner, { staffId: 'bad', date: '2026-10-01', startTime: '09:00', endTime: '17:00' })).status, 400)
  assert.equal((await request('/attendance', 'POST', owner, { staffId: 'bad', date: '2026-10-01', status: 'late' })).status, 400)
  assert.equal((await request('/leave', 'POST', owner, { staffId: 'bad', startDate: 'invalid', endDate: '2026-10-02' })).status, 400)
})
