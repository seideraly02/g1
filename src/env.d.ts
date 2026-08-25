/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_AUTHENTICATION?: 'true' | 'false'
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
