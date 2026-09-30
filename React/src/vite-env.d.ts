/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AUTH_LOGIN_PATH?: string
  readonly VITE_DASHBOARD_SUMMARY_PATH?: string
  readonly VITE_ENABLE_DEV_SESSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
