import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { buildValues } from './scripts/lib/build-values.ts'

export default defineConfig(({ mode }) => ({
  server: { port: 3481, strictPort: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
    // The values the build bakes in: .env files, then the shell (CI).
    buildValues({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }),
  ],
}))
