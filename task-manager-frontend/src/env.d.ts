/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_LOCAL_STORAGE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_TIMEZONE: string
  readonly VITE_TASK_TYPES: string
  readonly VITE_DEFAULT_TASK_TYPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}