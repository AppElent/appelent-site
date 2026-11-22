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

export const localeCookieValue = (locale: Locale) =>
  `${localeCookie}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
