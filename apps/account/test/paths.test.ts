import { describe, expect, it } from 'vitest'
import {
  initialLocale,
  localeCookieValue,
  localeFromCookie,
} from '../src/i18n/core.ts'
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
    '/%09/evil.example',
    '/%09/evil.example?x=%E0',
    '/%0a/evil.example#%',
    '/.//evil.example',
    '/Sign-In',
    '/%73ign-in',
    '/%73ign-in/%4%31',
    '/SIGN-IN/factor-one',
    '/recipes/%E0%A4%A',
    '/\t/evil.example',
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

  it("follows an app's ?lang over the cookie on first load", () => {
    expect(initialLocale('en', 'lang=nl')).toEqual({
      locale: 'en',
      fromQuery: true,
    })
    expect(initialLocale('nl', 'lang=en')).toEqual({
      locale: 'nl',
      fromQuery: true,
    })
  })

  it('falls back to the cookie when ?lang is missing or unknown', () => {
    expect(initialLocale(undefined, 'lang=en')).toEqual({
      locale: 'en',
      fromQuery: false,
    })
    expect(initialLocale('fr', undefined)).toEqual({
      locale: 'nl',
      fromQuery: false,
    })
    expect(initialLocale(['en'], undefined).fromQuery).toBe(false)
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
