import { ClerkProvider } from '@clerk/react'
import {
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { clerkPublishableKey, convexUrls } from '../config.ts'
import { initialLocale, type Locale } from '../i18n/core.ts'
import { LocaleProvider, persistLocale } from '../i18n/locale-context.tsx'
import { messages } from '../i18n/messages.ts'
import { clerkAppearance, clerkLocalization } from '../lib/clerk-theme.ts'
import {
  buildCsp,
  clerkFrontendHost,
  convexHost,
  securityHeaders,
} from '../lib/csp.ts'
import { NotFoundPage } from '../screens/NotFoundPage.tsx'
import appCss from '../styles.css?url'

const readCookie = createIsomorphicFn()
  .server(() => getRequestHeader('cookie'))
  .client(() => document.cookie)

export const Route = createRootRoute({
  loader: ({ location }) =>
    initialLocale(
      (location.search as Record<string, unknown>).lang,
      readCookie(),
    ),
  headers: ({ ssr }) => {
    const nonce = ssr?.nonce
    if (!nonce) return securityHeaders
    return {
      ...securityHeaders,
      'Content-Security-Policy': buildCsp({
        nonce,
        clerkHost: clerkFrontendHost(clerkPublishableKey),
        convexHosts: Object.values(convexUrls).map(convexHost),
        dev: import.meta.env.DEV,
      }),
      // Account data: never cache a rendered page.
      'Cache-Control': 'private, no-store',
    }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'noindex' },
      { name: 'color-scheme', content: 'light dark' },
      // <title> follows the locale in RootDocument.
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: ReactNode }) {
  const { locale: initial, fromQuery } = Route.useLoaderData()
  const [locale, setLocaleState] = useState<Locale>(initial)
  // An app's `?lang` is remembered like a switch choice, so the next page
  // (and the next visit without `?lang`) keeps the app's language.
  useEffect(() => {
    if (fromQuery) persistLocale(initial)
  }, [fromQuery, initial])
  const nonce = useRouter().options.ssr?.nonce
  const value = useMemo(
    () => ({
      locale,
      setLocale: (next: Locale) => {
        persistLocale(next)
        setLocaleState(next)
      },
    }),
    [locale],
  )
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
        <title>{messages[locale].meta.title}</title>
      </head>
      <body>
        <LocaleProvider value={value}>
          <ClerkProvider
            publishableKey={clerkPublishableKey}
            nonce={nonce}
            appearance={clerkAppearance}
            localization={clerkLocalization(locale)}
            signInUrl="/sign-in"
            afterSignOutUrl="/sign-in"
            telemetry={false}
          >
            {children}
          </ClerkProvider>
        </LocaleProvider>
        <Scripts />
      </body>
    </html>
  )
}
