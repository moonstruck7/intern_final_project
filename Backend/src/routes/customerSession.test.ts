import assert from 'node:assert/strict'
import test from 'node:test'

process.env.JWT_ACCESS_SECRET = 'test-only-access-secret-not-for-deployment'
const { createApp } = await import('../app/createApp.js')
const { createAccessToken } = await import('../auth/tokens.js')
const { User } = await import('../auth/User.js')
const { Customer } = await import('../domains/models.js')
const { Appointment } = await import('../appointments/model.js')
const { Invoice, Payment } = await import('../billing/model.js')
const { Notification } = await import('../insights/model.js')

const customerUserIdA = '507f1f77bcf86cd799439011'
const customerIdA = '507f1f77bcf86cd7994390a1'

const customerUserIdB = '507f1f77bcf86cd799439022'
const customerIdB = '507f1f77bcf86cd7994390b2'

async function request(path: string, method = 'GET', token?: string, body?: unknown) {
  const server = createApp().listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No TCP test address.')
  try {
    const isGet = method.toUpperCase() === 'GET'
    return await fetch(`http://127.0.0.1:${address.port}/api/v1/customer${path}`, {
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

function withModelStubs<T>(stubs: Record<string, unknown>, callback: () => Promise<T>) {
  const getModel = (key: string) => {
    if (key.startsWith('user')) return User
    if (key.startsWith('customer')) return Customer
    if (key.startsWith('appointment')) return Appointment
    if (key.startsWith('invoice')) return Invoice
    if (key.startsWith('payment')) return Payment
    if (key.startsWith('notification')) return Notification
    throw new Error(`Unknown model for stub: ${key}`)
  }

  const originals: Record<string, any> = {}
  for (const key of Object.keys(stubs)) {
    const model = getModel(key) as any
    const method = key.replace(/^(user|customer|appointment|invoice|payment|notification)/, '')
    originals[key] = { model, method, fn: model[method] }
    model[method] = stubs[key]
  }

  return callback().finally(() => {
    for (const { model, method, fn } of Object.values(originals)) {
      model[method] = fn
    }
  })
}

test('customer contract routes require authentication', async () => {
  assert.equal((await request('/me/customer')).status, 401)
  assert.equal((await request('/me/appointments', 'POST', undefined, {})).status, 401)
  assert.equal((await request('/me/appointments')).status, 401)
  assert.equal((await request('/me/invoices')).status, 401)
  assert.equal((await request('/me/notifications')).status, 401)
})

test('non-customer users cannot use customer booking or access customer data', async () => {
  const ownerToken = await createAccessToken({ userId: 'test-owner', role: 'owner' })
  const staffToken = await createAccessToken({ userId: 'test-staff', role: 'staff' })

  assert.equal((await request('/me/customer', 'GET', ownerToken)).status, 403)
  assert.equal((await request('/me/appointments', 'POST', ownerToken, {})).status, 403)
  assert.equal((await request('/me/appointments', 'GET', ownerToken)).status, 403)
  assert.equal((await request('/me/invoices', 'GET', ownerToken)).status, 403)
  assert.equal((await request('/me/notifications', 'GET', ownerToken)).status, 403)

  assert.equal((await request('/me/customer', 'GET', staffToken)).status, 403)
  assert.equal((await request('/me/appointments', 'POST', staffToken, {})).status, 403)
})

test('malformed customer token subjects are safely rejected before a User lookup', async () => {
  const token = await createAccessToken({ userId: 'test-customer', role: 'customer' })
  assert.equal((await request('/me/appointments', 'POST', token, {
    serviceId: '507f1f77bcf86cd799439012',
    staffId: '507f1f77bcf86cd799439013',
    date: '2026-10-01',
    startTime: '10:00',
  })).status, 403)
})

test('customer isolation: customers only read their own appointments, invoices, and notifications', async () => {
  const tokenA = await createAccessToken({ userId: customerUserIdA, role: 'customer' })
  let queriedAppointmentCustomerId: unknown
  let queriedInvoiceCustomerId: unknown
  let queriedNotificationRecipientId: unknown

  await withModelStubs({
    userfindById: async (id: string) => {
      if (id === customerUserIdA) return { _id: customerUserIdA, customerId: customerIdA }
      if (id === customerUserIdB) return { _id: customerUserIdB, customerId: customerIdB }
      return null
    },
    customerfindById: async (id: string) => ({ _id: id, displayName: 'Alice' }),
    appointmentfind: (filter: any) => {
      queriedAppointmentCustomerId = filter.customerId
      return { sort: () => ({ limit: () => Promise.resolve([]) }) }
    },
    invoicefind: (filter: any) => {
      queriedInvoiceCustomerId = filter.customerId
      return { sort: () => ({ limit: () => Promise.resolve([]) }) }
    },
    paymentfind: () => Promise.resolve([]),
    notificationfind: (filter: any) => {
      queriedNotificationRecipientId = filter.referenceId
      return { sort: () => ({ limit: () => Promise.resolve([]) }) }
    },
  }, async () => {
    const profileRes = await request('/me/customer', 'GET', tokenA)
    assert.equal(profileRes.status, 200)

    await request('/me/appointments', 'GET', tokenA)
    assert.equal(String(queriedAppointmentCustomerId), customerIdA)

    await request('/me/invoices', 'GET', tokenA)
    assert.equal(String(queriedInvoiceCustomerId), customerIdA)

    await request('/me/notifications', 'GET', tokenA)
    assert.equal(String(queriedNotificationRecipientId), customerIdA)
  })
})

test('customer account provisioning requires customers.manage permission and validates customer status', async () => {
  const manager = await createAccessToken({ userId: 'test-manager', role: 'manager' })
  const customer = await createAccessToken({ userId: customerUserIdA, role: 'customer' })

  // Customer cannot provision accounts
  assert.equal((await request('/507f1f77bcf86cd7994390a1/account', 'POST', customer, {
    loginIdentifier: 'alice@example.com',
    password: 'password123',
  })).status, 403)

  // Manager with customers.manage can invoke provisioning (model validation applies)
  await withModelStubs({
    customerfindById: async () => ({ _id: customerIdA, status: 'active' }),
    userexists: async () => false,
    usercreate: async (doc: any) => ({ _id: '507f1f77bcf86cd799439099', loginIdentifier: doc.loginIdentifier, roles: doc.roles }),
  }, async () => {
    const res = await request(`/${customerIdA}/account`, 'POST', manager, {
      loginIdentifier: 'alice@example.com',
      password: 'password123',
    })
    assert.equal(res.status, 201)
  })
})
