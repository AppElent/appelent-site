/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_GATHER_CONVEX_URL?: string
  readonly VITE_FOUNDRY_CONVEX_URL?: string
  readonly VITE_FAIRWAY_CONVEX_URL?: string
  readonly VITE_ARCADE_CONVEX_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
