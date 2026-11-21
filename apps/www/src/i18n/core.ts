// Copied from developer-home standards/i18n/examples/core.ts (i18n standard
// 3.0.0): only the helpers a static site needs. No React provider: pages are
// rendered at build time, one file per locale.

export const locales = ['nl', 'en'] as const
export type Locale = (typeof locales)[number]

/** `/` negotiates: Dutch for `nl`, English for everything else. */
export const fallbackLocale: Locale = 'en'

/** The cookie that remembers a choice made in the NL | EN switch. */
export const localeCookie = 'lang'

export function isLocale<L extends string>(
  list: readonly L[],
  value: unknown,
): value is L {
  return (list as readonly unknown[]).includes(value)
}

/**
 * Resolve the active locale: explicit cookie choice first, then the first
 * Accept-Language entry matching a supported locale, then the fallback.
 */
export function resolveLocale<L extends string>(
  list: readonly L[],
  fallback: L,
  cookieValue: string | undefined,
  acceptLanguage: string | undefined,
): L {
  if (isLocale(list, cookieValue)) return cookieValue
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(',')) {
      const tag = part.split(';')[0]?.trim().toLowerCase()
      if (!tag) continue
      for (const locale of list) {
        if (tag === locale || tag.startsWith(`${locale}-`)) return locale
      }
    }
  }
  return fallback
}

/** Interpolate {name} placeholders. Unknown placeholders are left as-is. */
export function fmt(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )
}
