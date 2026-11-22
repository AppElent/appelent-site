import type { Locale } from '../i18n/core.ts'

export const profilePath = (locale: Locale) =>
  locale === 'nl' ? '/profiel' : '/profile'

/**
 * Where to go after signing in. Only a path on this origin: an absolute or
 * protocol-relative URL (`//evil.example`) would make the sign-in page an
 * open redirect.
 */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return '/'
  }
  // Browsers drop tabs and newlines when parsing (`/%09/evil.example` reads
  // as `//evil.example`): resolve it and insist on this origin.
  const base = 'https://account.invalid'
  let url: URL
  try {
    url = new URL(value, base)
  } catch {
    return '/'
  }
  if (url.origin !== base || /[\t\n\r]/.test(decodeURIComponentSafe(value)))
    return '/'
  const path = `${url.pathname}${url.search}${url.hash}`
  // `/.//evil.example` normalizes to `//evil.example`.
  if (path.startsWith('//') || path.startsWith('/sign-in')) return '/'
  return path
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** The profile's route id, for typed links (`params: { _splat: '' }`). */
export const profileRoute = (locale: Locale) =>
  locale === 'nl' ? ('/profiel/$' as const) : ('/profile/$' as const)
