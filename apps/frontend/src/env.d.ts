/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_FAKE_DYMO?: string
  // Ajoutez d'autres variables d'environnement ici
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Injected at build time, see `define` in vite.config.ts.
declare const __APP_VERSION__: string
