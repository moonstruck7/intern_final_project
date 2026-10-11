import assert from 'node:assert/strict'
import test from 'node:test'

process.env.JWT_ACCESS_SECRET = 'test-only-access-secret-not-for-deployment'

const { createApp } = await import('../app/createApp.js')
const { createAccessToken } = await import('../auth/tokens.js')
const { User } = await import('../auth/User.js')
const { Availability, Staff } = await import('../domains/models.js')

const customerUserId = '507f1f77bcf86cd799439011'
const staffId = '507f1f77bcf86cd799439012'

async function request(path: string, token?: string) {
  const server = createApp().listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No TCP test address.')
  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/customer${path}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

function withModelStubs<T>(stubs: Record<string, unknown>, callback: () => Promise<T>) {
  const targetFor = (key: string) => (key.startsWith('user') ? User : key.startsWith('staff') ? Staff : Availability) as any
  const originals = Object.fromEntries(Object.keys(stubs).map((key) => [key, targetFor(key)]))
  const previous = Object.fromEntries(Object.keys(stubs).map((key) => [key, (originals[key] as any)[key.replace(/^(user|staff|availability)/, '')]]))
  for (const [key, implementation] of Object.entries(stubs)) {
    const model = originals[key] as any
    model[key.replace(/^(user|staff|availability)/, '')] = implementation
  }
  return callback().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      ;(originals[key] as any)[key.replace(/^(user|staff|availability)/, '')] = value
    }
  })
}

async function asCustomer() {
  return createAccessToken({ userId: customerUserId, role: 'customer' })
}

test('customer discovery requires authentication', async () => {
  assert.equal((await request('/staff')).status, 401)
})

test('customer staff discovery returns only safe active staff fields', async () => {
  let staffFilter: unknown
  await withModelStubs({
    userfindById: async () => ({ customerId: customerUserId }),
    stafffind: (filter: unknown) => {
      staffFilter = filter
      return { sort: () => ({ select: () => Promise.resolve([{ _id: staffId, displayName: 'Asha', designation: 'Stylist' }]) }) }
    },
  }, async () => {
    const response = await request('/staff', await asCustomer())
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { data: [{ _id: staffId, displayName: 'Asha', designation: 'Stylist' }] })
  })
  assert.deepEqual(staffFilter, { status: 'active' })
})

test('customer availability is date-scoped and exposes only booking fields', async () => {
  let availabilityFilter: unknown
  await withModelStubs({
    userfindById: async () => ({ customerId: customerUserId }),
    stafffindOne: async () => ({ _id: staffId }),
    availabilityfind: (filter: unknown) => {
      availabilityFilter = filter
      return { sort: () => ({ select: () => Promise.resolve([{ _id: '507f1f77bcf86cd799439013', staffId, date: '2026-10-01', startTime: '09:00', endTime: '17:00' }]) }) }
    },
  }, async () => {
    const response = await request(`/staff/${staffId}/availability?date=2026-10-01`, await asCustomer())
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { data: [{ _id: '507f1f77bcf86cd799439013', staffId, date: '2026-10-01', startTime: '09:00', endTime: '17:00' }] })
  })
  assert.deepEqual(availabilityFilter, { staffId, date: '2026-10-01', status: 'active' })
})

test('customer discovery rejects invalid or unavailable staff and customer access to admin routes', async () => {
  const token = await asCustomer()
  await withModelStubs({ userfindById: async () => ({ customerId: customerUserId }) }, async () => {
    assert.equal((await request('/staff/not-an-id/availability?date=2026-10-01', token)).status, 400)
  })
  await withModelStubs({
    userfindById: async () => ({ customerId: customerUserId }),
    stafffindOne: async () => null,
  }, async () => {
    assert.equal((await request(`/staff/${staffId}/availability?date=2026-10-01`, token)).status, 404)
  })

  const server = createApp().listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No TCP test address.')
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/staff`, { headers: { authorization: `Bearer ${token}` } })
    assert.equal(response.status, 403)
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})
