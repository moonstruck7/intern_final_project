import assert from 'node:assert/strict'
import test from 'node:test'

process.env.JWT_ACCESS_SECRET = 'test-only-access-secret-not-for-deployment'

const { createApp } = await import('../app/createApp.js')
const { createAccessToken } = await import('../auth/tokens.js')

async function request(path: string, token?: string) {
  const app = createApp()
  const server = app.listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No TCP test address.')
  try { return await fetch(`http://127.0.0.1:${address.port}/api/v1/auth${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }) }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) }
}

test('rejects a protected endpoint without an access token', async () => {
  assert.equal((await request('/me')).status, 401)
})

test('rejects a malformed access token', async () => {
  assert.equal((await request('/me', 'not-a-token')).status, 401)
})

test('allows a valid access token to read the authenticated context', async () => {
  const response = await request('/me', await createAccessToken({ userId: 'test-user', role: 'staff' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { user: { userId: 'test-user', role: 'staff' } })
})

test('enforces centralized permissions', async () => {
  assert.equal((await request('/authorization-check', await createAccessToken({ userId: 'test-user', role: 'staff' }))).status, 403)
  assert.equal((await request('/authorization-check', await createAccessToken({ userId: 'test-owner', role: 'owner' }))).status, 204)
})
