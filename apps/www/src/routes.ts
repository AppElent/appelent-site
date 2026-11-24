import type { Locale } from './i18n/index.ts'

// The public URL of every page per locale (designs/site/site_final.md, Routes).
// Dutch lives at the root, English under /en/. The build writes each page to
// the file Workers static assets serves at that path (html_handling
// "auto-trailing-slash": privacy.html → /privacy, en/index.html → /en/).

export const origin = 'https://appelent.nl'

export type PageId = 'home' | 'privacy' | 'support'

export const pagePaths: Record<PageId, Record<Locale, string>> = {
  home: { nl: '/', en: '/en/' },
  privacy: { nl: '/privacy', en: '/en/privacy' },
  support: { nl: '/support', en: '/en/support' },
}

/** The 404 page per locale. The Worker serves it with status 404. */
export const notFoundPaths: Record<Locale, string> = {
  nl: '/404',
  en: '/en/404',
}

/** Where the Worker sends /account. */
export const accountUrl = 'https://account.appelent.nl'

/**
 * The public status page (APP-631): UptimeRobot, one row per app for web and
 * backend. Becomes https://status.appelent.nl once that custom domain exists.
 */
export const statusUrl = 'https://stats.uptimerobot.com/r6SahVpaDP'

export function outputFile(path: string): string {
  if (path.endsWith('/')) return `${path.slice(1)}index.html`
  return `${path.slice(1)}.html`
}

/** The NL | EN switch: the Worker stores the choice in a cookie, then redirects to the clean path. */
export function switchHref(path: string, locale: Locale): string {
  return `${path}?lang=${locale}`
}
