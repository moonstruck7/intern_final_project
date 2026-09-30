import { Schema, model } from 'mongoose'
import { roles, type Role } from './roles.js'

export interface UserDocument {
  loginIdentifier: string
  passwordHash: string
  isActive: boolean
  roles: Role[]
  refreshSessions: Array<{ tokenHash: string; expiresAt: Date; createdAt: Date }>
}

const refreshSessionSchema = new Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
}, { _id: false })

const userSchema = new Schema<UserDocument>({
  loginIdentifier: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  isActive: { type: Boolean, required: true, default: true },
  roles: { type: [{ type: String, enum: roles }], required: true, default: ['staff'] },
  refreshSessions: { type: [refreshSessionSchema], required: true, default: [] },
}, { timestamps: true })

export const User = model<UserDocument>('User', userSchema)
