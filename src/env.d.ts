/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_AUTHENTICATION?: 'true' | 'false'
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AUTH_DEV_OTP_HINT?: 'true' | 'false'
  readonly VITE_AUTH_DEV_OTP_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
