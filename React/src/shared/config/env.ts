function readOptionalEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export const env = {
  apiBaseUrl: readOptionalEnv('VITE_API_BASE_URL'),
  authLoginPath: readOptionalEnv('VITE_AUTH_LOGIN_PATH'),
  dashboardSummaryPath: readOptionalEnv('VITE_DASHBOARD_SUMMARY_PATH'),
  enableDevSession: import.meta.env.VITE_ENABLE_DEV_SESSION === 'true',
} as const
