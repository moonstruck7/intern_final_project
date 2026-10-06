import mongoose, { type ConnectOptions } from 'mongoose'
import { env } from '../config/env.js'

export type DatabaseStatus = 'not_configured' | 'connecting' | 'connected' | 'unavailable'

let connectionWasConfigured = false

mongoose.connection.on('connected', () => {
  connectionWasConfigured = true
})

mongoose.connection.on('error', () => {
  connectionWasConfigured = true
})

mongoose.connection.on('disconnected', () => {
  connectionWasConfigured = true
})

export function getDatabaseStatus(): DatabaseStatus {
  switch (mongoose.connection.readyState) {
    case mongoose.ConnectionStates.connected:
      return 'connected'
    case mongoose.ConnectionStates.connecting:
      return 'connecting'
    default:
      return connectionWasConfigured ? 'unavailable' : 'not_configured'
  }
}

/**
 * Connects the shared Mongoose connection when a URI is configured. Connection
 * failures are deliberately represented as an unavailable status so the API
 * can start in a transparent degraded state while no business routes exist.
 */
export async function connectDatabase(
  uri?: string,
  options: ConnectOptions = {},
): Promise<DatabaseStatus> {
  const resolvedUri = arguments.length === 0 ? env.mongodbUri : uri
  if (!resolvedUri) return getDatabaseStatus()

  connectionWasConfigured = true

  try {
    await mongoose.connect(resolvedUri, options)
  } catch {
    // Raw driver errors can include sensitive connection details. Keep those
    // details out of API responses and leave the status available to callers.
  }

  return getDatabaseStatus()
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
    await mongoose.disconnect()
  }
  connectionWasConfigured = false
}
