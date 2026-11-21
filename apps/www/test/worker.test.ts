import { describe, expect, it } from 'vitest'
import { type Env, handle } from '../src/worker.ts'
import { fakeAssets } from './support/fake-assets.ts'

const files = {
  'index.html': 'NL HOME',
  'en/index.html': 'EN HOME',
  'privacy.html': 'NL PRIVACY',
  'en/privacy.html': 'EN PRIVACY',
  '404.html': 'NL 404',
  'en/404.html': 'EN 404',
  'favicon.ico': 'ICO',
  'assets/styles.abc.css': 'CSS',
}

const production: Env = { ASSETS: fakeAssets(files), INDEXING: 'on' }
const staging: Env = { ASSETS: fakeAssets(files), INDEXING: 'off' }

function get(
  path: string,
  headers: Record<string, string> = {},
  env = production,
  host = 'appelent.nl',
) {
  return handle(new Request(`https://${host}${path}`, { headers }), env)
}

describe('/ language negotiation', () => {
  it('serves Dutch for an nl browser on the first visit and remembers it', async () => {
    const res = await get('/', { 'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8' })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('NL HOME')
    expect(res.headers.get('Set-Cookie')).toMatch(
      /^lang=nl; Path=\/; Max-Age=31536000; SameSite=Lax; Secure$/,
    )
    expect(res.headers.get('Vary')).toBe('Accept-Language, Cookie')
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache')
  })

  it('sends every other browser to /en/ and remembers English', async () => {
    for (const lang of ['en-US,en;q=0.9', 'de-DE', '']) {
      const res = await get('/', lang ? { 'Accept-Language': lang } : {})
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toBe('/en/')
      expect(res.headers.get('Set-Cookie')).toMatch(/^lang=en;/)
    }
  })

  it('follows the cookie after the first visit, not Accept-Language', async () => {
    const dutch = await get('/', {
      Cookie: 'other=1; lang=nl',
      'Accept-Language': 'en',
    })
    expect(dutch.status).toBe(200)
    expect(dutch.headers.get('Set-Cookie')).toBeNull()

    const english = await get('/', {
      Cookie: 'lang=en',
      'Accept-Language': 'nl',
    })
    expect(english.status).toBe(302)
    expect(english.headers.get('Location')).toBe('/en/')
    expect(english.headers.get('Set-Cookie')).toBeNull()
  })
})

describe('the NL | EN switch', () => {
  it('stores the choice and redirects to the clean URL', async () => {
    const res = await get('/privacy?lang=nl', { Cookie: 'lang=en' })
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/privacy')
    expect(res.headers.get('Set-Cookie')).toMatch(/^lang=nl;/)
  })

  it('keeps other query parameters and ignores an unknown language', async () => {
    const res = await get('/en/?utm=x&lang=fr')
    expect(res.headers.get('Location')).toBe('/en/?utm=x')
    expect(res.headers.get('Set-Cookie')).toBeNull()
  })
})

describe('redirects', () => {
  it('sends /account to the account portal', async () => {
    for (const path of ['/account', '/account/']) {
      const res = await get(path)
      expect(res.status).toBe(302)
      expect(res.headers.get('Location')).toBe('https://account.appelent.nl')
    }
  })

  it('301s www.appelent.nl to the apex, keeping path and query', async () => {
    const res = await get('/privacy?x=1', {}, production, 'www.appelent.nl')
    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('https://appelent.nl/privacy?x=1')
  })

  it('does not treat the staging host as www', async () => {
    const res = await get('/privacy', {}, staging, 'www-stg.appelent.nl')
    expect(res.status).toBe(200)
  })
})

describe('404', () => {
  it('serves the English 404 under /en/', async () => {
    const res = await get('/en/nope', { 'Accept-Language': 'nl' })
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('EN 404')
    expect(res.headers.get('Content-Type')).toContain('text/html')
  })

  it('follows the cookie, then Accept-Language, elsewhere', async () => {
    expect(
      await (
        await get('/nope', { Cookie: 'lang=nl', 'Accept-Language': 'en' })
      ).text(),
    ).toBe('NL 404')
    expect(
      await (await get('/nope', { 'Accept-Language': 'nl-BE' })).text(),
    ).toBe('NL 404')
    expect(await (await get('/nope')).text()).toBe('EN 404')
  })

  it('never serves the 404 files with status 200', async () => {
    for (const path of ['/404', '/404.html', '/en/404', '/en/404.html']) {
      expect((await get(path)).status).toBe(404)
    }
  })
})

describe('pages and assets', () => {
  it('serves pages with revalidation', async () => {
    const res = await get('/en/privacy')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('EN PRIVACY')
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=0, must-revalidate',
    )
  })

  it('caches fingerprinted assets forever and icons for a day', async () => {
    expect(
      (await get('/assets/styles.abc.css')).headers.get('Cache-Control'),
    ).toBe('public, max-age=31536000, immutable')
    expect((await get('/favicon.ico')).headers.get('Cache-Control')).toBe(
      'public, max-age=86400',
    )
  })

  it('passes the asset layer’s trailing-slash redirect through', async () => {
    const res = await get('/en')
    expect(res.status).toBe(307)
    expect(res.headers.get('Location')).toBe('/en/')
  })

  it('rejects methods other than GET and HEAD', async () => {
    const res = await handle(
      new Request('https://appelent.nl/', { method: 'POST' }),
      production,
    )
    expect(res.status).toBe(405)
    expect(res.headers.get('Allow')).toBe('GET, HEAD')
  })
})

describe('headers and robots', () => {
  it('adds security headers everywhere', async () => {
    for (const res of [
      await get('/en/'),
      await get('/nope'),
      await get('/account'),
    ]) {
      expect(res.headers.get('Content-Security-Policy')).toContain(
        "default-src 'none'",
      )
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    }
  })

  it('keeps staging out of search engines', async () => {
    const res = await get('/en/', {}, staging, 'www-stg.appelent.nl')
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex')
    expect(
      await (
        await get('/robots.txt', {}, staging, 'www-stg.appelent.nl')
      ).text(),
    ).toContain('Disallow: /')
  })

  it('lets production be indexed, with the sitemap', async () => {
    const res = await get('/en/')
    expect(res.headers.get('X-Robots-Tag')).toBeNull()
    expect(await (await get('/robots.txt')).text()).toContain(
      'Sitemap: https://appelent.nl/sitemap.xml',
    )
  })
})
