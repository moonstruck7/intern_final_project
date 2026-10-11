import bcrypt from "bcryptjs"
import { z } from "zod"
import { env } from "../config/env.js"
import { HttpError } from "../shared/errors.js"
import { permissionsForRole, type Role } from "./roles.js"
import { User } from "./User.js"
import { Customer } from "../domains/models.js"
import { createAccessToken, createRefreshToken, hashRefreshToken } from "./tokens.js"

const credentialsSchema = z.object({
  loginIdentifier: z.string().trim().min(3).max(254),
  password: z.string().min(8).max(128),
})

const registerSchema = z.object({
  loginIdentifier: z.string().trim().min(3).max(254).optional(),
  email: z.string().trim().min(3).max(254).optional(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().optional(),
})

const refreshSchema = z.object({ refreshToken: z.string().min(32).max(512) })

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new HttpError(400, "VALIDATION_ERROR", "Invalid request.")
  return result.data
}

function safeUser(user: { _id: unknown; loginIdentifier: string; isActive: boolean; roles: Role[] }) {
  return { id: String(user._id), loginIdentifier: user.loginIdentifier, isActive: user.isActive, roles: user.roles, permissions: permissionsForRole(user.roles[0]) }
}

async function issueSession(user: InstanceType<typeof User>) {
  const refreshToken = createRefreshToken()
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 86_400_000)
  user.refreshSessions.push({ tokenHash: hashRefreshToken(refreshToken), expiresAt, createdAt: new Date() })
  await user.save()
  return { accessToken: await createAccessToken({ userId: String(user._id), role: user.roles[0] }), refreshToken, refreshExpiresAt: expiresAt.toISOString() }
}

const invalidCredentials = () => new HttpError(401, "UNAUTHENTICATED", "Invalid login credentials.")

export async function login(input: unknown) {
  const credentials = parse(credentialsSchema, input)
  const user = await User.findOne({ loginIdentifier: credentials.loginIdentifier.toLowerCase() }).select("+passwordHash")
  if (!user || !user.isActive || !(await bcrypt.compare(credentials.password, user.passwordHash))) throw invalidCredentials()
  const session = await issueSession(user)
  return { user: safeUser(user), ...session }
}

export async function register(input: unknown) {
  const raw = parse(registerSchema, input)
  const identifier = (raw.loginIdentifier || raw.email)?.toLowerCase().trim()
  if (!identifier) {
    throw new HttpError(400, "VALIDATION_ERROR", "Email or loginIdentifier is required.")
  }

  const existingUser = await User.findOne({ loginIdentifier: identifier })
  if (existingUser) {
    throw new HttpError(400, "VALIDATION_ERROR", "User already exists.")
  }

  const displayName = raw.displayName || raw.name || identifier

  let customer: any = await Customer.findOne({ email: identifier })
  if (!customer) {
    customer = await Customer.create({
      displayName,
      email: identifier,
      phone: raw.phone,
      status: "active",
    })
  }

  const passwordHash = await bcrypt.hash(raw.password, 12)
  const user = await User.create({
    loginIdentifier: identifier,
    passwordHash,
    roles: ["customer"],
    customerId: customer._id,
    isActive: true,
  })

  const session = await issueSession(user)
  return { user: safeUser(user), ...session }
}

export async function refresh(input: unknown) {
  const { refreshToken } = parse(refreshSchema, input)
  const tokenHash = hashRefreshToken(refreshToken)
  const user = await User.findOne({ "refreshSessions.tokenHash": tokenHash }).select("+passwordHash")
  const session = user?.refreshSessions.find((item) => item.tokenHash === tokenHash)
  if (!user || !session || !user.isActive || session.expiresAt <= new Date()) throw new HttpError(401, "UNAUTHENTICATED", "Authentication is required.")
  user.refreshSessions = user.refreshSessions.filter((item) => item.tokenHash !== tokenHash)
  const nextSession = await issueSession(user)
  return { user: safeUser(user), ...nextSession }
}

export async function logout(input: unknown) {
  const { refreshToken } = parse(refreshSchema, input)
  const tokenHash = hashRefreshToken(refreshToken)
  const user = await User.findOne({ "refreshSessions.tokenHash": tokenHash })
  if (user) { user.refreshSessions = user.refreshSessions.filter((item) => item.tokenHash !== tokenHash); await user.save() }
}
