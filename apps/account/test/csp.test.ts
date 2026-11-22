import { describe, expect, it } from 'vitest'
import {
  buildCsp,
  clerkFrontendHost,
  convexHost,
  securityHeaders,
} from '../src/lib/csp.ts'

const pk = (host: string, env = 'test') => `pk_${env}_${btoa(`${host}$`)}`

describe('clerkFrontendHost', () => {
  it('decodes the Frontend API host', () => {
    expect(clerkFrontendHost(pk('calm-cricket-82.clerk.accounts.dev'))).toBe(
      'calm-cricket-82.clerk.accounts.dev',
    )
    expect(clerkFrontendHost(pk('clerk.appelent.nl', 'live'))).toBe(
      'clerk.appelent.nl',
    )
  })

  it('rejects keys that are not publishable keys or decode to junk', () => {
    expect(clerkFrontendHost('sk_test_abc')).toBeNull()
    expect(clerkFrontendHost('')).toBeNull()
    expect(clerkFrontendHost(pk('evil.example; script-src *'))).toBeNull()
  })
})

describe('convexHost', () => {
  it('takes the host of an https URL only', () => {
    expect(
      convexHost('https://fearless-mouse-671.eu-west-1.convex.cloud'),
    ).toBe('fearless-mouse-671.eu-west-1.convex.cloud')
    expect(convexHost('http://insecure.example')).toBeNull()
    expect(convexHost('not a url')).toBeNull()
    expect(convexHost(undefined)).toBeNull()
  })
})

describe('buildCsp', () => {
  const csp = buildCsp({
    nonce: 'abc123',
    clerkHost: 'clerk.appelent.nl',
    convexHosts: ['a.eu-west-1.convex.cloud', null, 'b.eu-west-1.convex.cloud'],
  })
  const directive = (name: string) =>
    csp
      .split('; ')
      .find((d) => d.startsWith(`${name} `))
      ?.split(' ')
      .slice(1)

  it('allows scripts from self, the nonce and Clerk only', () => {
    const script = directive('script-src')
    expect(script).toContain("'nonce-abc123'")
    expect(script).toContain('https://clerk.appelent.nl')
    expect(script).not.toContain("'unsafe-inline'")
    expect(script).not.toContain("'unsafe-eval'")
  })

  it('connects only to self, Clerk and the Convex hosts', () => {
    expect(directive('connect-src')).toEqual([
      "'self'",
      'https://clerk.appelent.nl',
      'https://*.protect.clerk.com:*',
      'https://a.eu-west-1.convex.cloud',
      'https://b.eu-west-1.convex.cloud',
    ])
  })

  it('locks framing, base and objects', () => {
    expect(directive('frame-ancestors')).toEqual(["'none'"])
    expect(directive('base-uri')).toEqual(["'none'"])
    expect(directive('object-src')).toEqual(["'none'"])
    expect(directive('default-src')).toEqual(["'self'"])
  })

  it('adds the dev server allowances only in dev', () => {
    const dev = buildCsp({
      nonce: 'n',
      clerkHost: null,
      convexHosts: [],
      dev: true,
    })
    expect(dev).toContain("'unsafe-eval'")
    expect(dev).toContain('ws:')
    expect(csp).not.toContain('ws:')
  })

  it('ships the other security headers', () => {
    expect(securityHeaders['X-Frame-Options']).toBe('DENY')
    expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff')
    expect(securityHeaders['Strict-Transport-Security']).toMatch(/max-age=\d+/)
  })
})
