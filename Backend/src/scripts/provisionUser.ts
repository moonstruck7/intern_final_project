import bcrypt from 'bcryptjs'
import { connectDatabase, disconnectDatabase } from '../database/mongoose.js'
import { roles, type Role } from '../auth/roles.js'
import { User } from '../auth/User.js'

const loginIdentifier = process.env.PROVISION_USER_LOGIN?.trim().toLowerCase()
const password = process.env.PROVISION_USER_PASSWORD
const requestedRole = process.env.PROVISION_USER_ROLE?.trim() ?? 'owner'

if (!loginIdentifier || !password || password.length < 8 || !roles.includes(requestedRole as Role)) {
  throw new Error('Set PROVISION_USER_LOGIN, PROVISION_USER_PASSWORD (8+ characters), and an optional valid PROVISION_USER_ROLE.')
}

if ((await connectDatabase()) !== 'connected') throw new Error('MongoDB must be connected to provision a user.')

try {
  if (await User.exists({ loginIdentifier })) throw new Error('A user with that login identifier already exists.')
  await User.create({ loginIdentifier, passwordHash: await bcrypt.hash(password, 12), roles: [requestedRole as Role] })
  console.info('User provisioned.')
} finally {
  await disconnectDatabase()
}
