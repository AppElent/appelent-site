// Renders one screen inside a memory router, the locale, and a PortalProvider
// with the given (fake) clients: everything the screens need except Clerk.

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { type RenderResult, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { vi } from 'vitest'
import type { Locale } from '../src/i18n/core.ts'
import { LocaleProvider } from '../src/i18n/locale-context.tsx'
import type { AppId } from '../src/portal/apps.ts'
import type { PortalClient } from '../src/portal/contract.ts'
import {
  type PortalClients,
  PortalProvider,
} from '../src/portal/portal-context.tsx'

export function renderScreen(
  ui: ReactNode,
  options: {
    clients: Partial<Record<AppId, PortalClient | null>>
    locale?: Locale
    /** Where the memory router starts, with its query: `/?type=new`. */
    path?: string
  },
): RenderResult & { router: { state: { location: { search: unknown } } } } {
  const clients: PortalClients = {
    gather: null,
    foundry: null,
    fairway: null,
    arcade: null,
    ...options.clients,
  }
  const root = createRootRoute({
    component: () => (
      <LocaleProvider
        value={{ locale: options.locale ?? 'nl', setLocale: () => {} }}
      >
        <PortalProvider clients={clients}>
          <Outlet />
        </PortalProvider>
      </LocaleProvider>
    ),
  })
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => ui,
  })
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: [options.path ?? '/'] }),
  })
  // The app registers its own router type; this one only renders `ui`.
  return {
    ...render(<RouterProvider router={router as never} />),
    router,
  }
}

/** Records every file saveFile hands the browser. */
export function captureDownloads() {
  const names: string[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    names.push(this.download)
  })
  return names
}

/** A promise you resolve by hand. */
export function deferred<T = void>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
