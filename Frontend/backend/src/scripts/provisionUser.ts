import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { connectDatabase, disconnectDatabase } from '../database/mongoose.js'
import { roles, type Role } from '../auth/roles.js'
import { User } from '../auth/User.js'

if (env.nodeEnv !== 'development' || process.env.ALLOW_LOCAL_USER_PROVISIONING !== 'true') {
  throw new Error('Local provisioning is disabled. Set NODE_ENV=development and ALLOW_LOCAL_USER_PROVISIONING=true.')
}

if (!env.mongodbUri) throw new Error('MONGODB_URI is not configured; the initial owner cannot be created.')
if (!env.jwtAccessSecret) throw new Error('JWT_ACCESS_SECRET is not configured; the initial owner cannot be created.')

const loginIdentifier = process.env.PROVISION_USER_LOGIN?.trim().toLowerCase()
const password = process.env.PROVISION_USER_PASSWORD
const requestedRole = process.env.PROVISION_USER_ROLE?.trim() ?? 'owner'

if (!loginIdentifier || !password || password.length < 8 || !roles.includes(requestedRole as Role)) {
  throw new Error('Set PROVISION_USER_LOGIN, PROVISION_USER_PASSWORD (8+ characters), and an optional valid PROVISION_USER_ROLE.')
}

if ((await connectDatabase()) !== 'connected') throw new Error('MONGODB_URI is unreachable; the initial owner cannot be created.')

try {
  if (await User.exists({ loginIdentifier })) {
    console.info('User already exists; no duplicate created.')
  } else {
    await User.create({ loginIdentifier, passwordHash: await bcrypt.hash(password, 12), roles: [requestedRole as Role] })
    console.info('User provisioned.')
  }
} finally {
  await disconnectDatabase()
}
