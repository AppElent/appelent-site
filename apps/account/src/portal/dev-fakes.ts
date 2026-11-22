// `pnpm dev` only: `?fake=<scenario>` swaps the real app clients for the
// design's fake data until the apps ship `accountPortal` (APP-482). The
// production build drops this branch (`import.meta.env.DEV` is false there).
import { fakeClients, type Scenario, scenarios } from './fake.ts'
import type { PortalClients } from './portal-context.tsx'

const storageKey = 'portal-fake'

export function devScenario(): PortalClients | null {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null
  const asked = new URLSearchParams(window.location.search).get('fake')
  if (asked === 'off') sessionStorage.removeItem(storageKey)
  else if (asked) sessionStorage.setItem(storageKey, asked)
  const scenario = sessionStorage.getItem(storageKey)
  return scenarios.includes(scenario as Scenario)
    ? fakeClients(scenario as Scenario)
    : null
}
