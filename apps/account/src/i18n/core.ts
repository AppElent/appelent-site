export const locales = ['nl', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'nl'
export const localeCookie = 'lang'

export const isLocale = (value: unknown): value is Locale =>
  value === 'nl' || value === 'en'

/** Reads the `lang` cookie from a Cookie header or `document.cookie`. */
export function localeFromCookie(cookie: string | null | undefined): Locale {
  for (const part of (cookie ?? '').split(';')) {
    const [name, value] = part.trim().split('=')
    if (name === localeCookie && isLocale(value)) return value
  }
  return defaultLocale
}

/**
 * The locale for a page load. An app that opens the portal passes its own
 * language as `?lang=en|nl` (APP-673); that wins over the cookie, so the
 * portal speaks the app's language. Without it, the cookie decides.
 */
export function initialLocale(
  query: unknown,
  cookie: string | null | undefined,
): { locale: Locale; fromQuery: boolean } {
  if (isLocale(query)) return { locale: query, fromQuery: true }
  return { locale: localeFromCookie(cookie), fromQuery: false }
}

export const localeCookieValue = (locale: Locale) =>
  `${localeCookie}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
