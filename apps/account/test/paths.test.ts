import { describe, expect, it } from 'vitest'
import { localeCookieValue, localeFromCookie } from '../src/i18n/core.ts'
import { profilePath, safeRedirect } from '../src/lib/paths.ts'

describe('safeRedirect', () => {
  it.each(['/', '/export', '/apps/gather?x=1', '/profiel'])(
    'keeps %s',
    (path) => {
      expect(safeRedirect(path)).toBe(path)
    },
  )

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/sign-in',
    '/sign-in?redirect=%2F',
    '',
    undefined,
    42,
  ])('sends %s to /', (value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})

describe('locale', () => {
  it('reads the lang cookie and defaults to Dutch', () => {
    expect(localeFromCookie('a=1; lang=en')).toBe('en')
    expect(localeFromCookie('lang=fr')).toBe('nl')
    expect(localeFromCookie(undefined)).toBe('nl')
  })

  it('writes a first-party cookie', () => {
    expect(localeCookieValue('en')).toMatch(
      /^lang=en; Path=\/; .*SameSite=Lax; Secure$/,
    )
  })

  it('names the profile per language', () => {
    expect(profilePath('nl')).toBe('/profiel')
    expect(profilePath('en')).toBe('/profile')
  })
})
