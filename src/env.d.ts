/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REQUIRE_AUTHENTICATION?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
