// Public build values (env.manifest.ts). Read once; the Worker builds its CSP
// from the same values, so the browser can only reach these hosts.
import type { AppId } from './portal/apps.ts'

export const clerkPublishableKey: string =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''

export const convexUrls: Record<AppId, string | undefined> = {
  gather: import.meta.env.VITE_GATHER_CONVEX_URL,
  foundry: import.meta.env.VITE_FOUNDRY_CONVEX_URL,
  fairway: import.meta.env.VITE_FAIRWAY_CONVEX_URL,
  arcade: import.meta.env.VITE_ARCADE_CONVEX_URL,
}
