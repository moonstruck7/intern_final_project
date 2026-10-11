import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}

function readPort(value: string | undefined): number {
  if (!value) return 4000
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.")
  }
  return port
}

function readApiPrefix(value: string | undefined): string {
  const prefix = value ?? "/api/v1"
  if (!prefix.startsWith("/")) {
    throw new Error("API_PREFIX must begin with /.")
  }
  return prefix.replace(/\/$/, "") || "/"
}

export const env = {
  nodeEnv: readOptional("NODE_ENV") ?? "development",
  port: readPort(readOptional("PORT")),
  apiPrefix: readApiPrefix(readOptional("API_PREFIX")),
  corsOrigin: readOptional("CORS_ORIGIN"),
  mongodbUri: readOptional("MONGODB_URI"),
  jwtAccessSecret: readOptional("JWT_ACCESS_SECRET"),
  accessTokenTtl: readOptional("ACCESS_TOKEN_TTL") ?? "15m",
  refreshTokenTtlDays: Number(readOptional("REFRESH_TOKEN_TTL_DAYS") ?? "30"),
} as const
