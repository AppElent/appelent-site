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
  if (value.startsWith('/sign-in')) return '/'
  return value
}

/** The profile's route id, for typed links (`params: { _splat: '' }`). */
export const profileRoute = (locale: Locale) =>
  locale === 'nl' ? ('/profiel/$' as const) : ('/profile/$' as const)
