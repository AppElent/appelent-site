// The appelent.nl Worker. It runs before the static assets (run_worker_first)
// and owns everything a static file cannot do (designs/site/site_final.md):
//
// - `/` follows Accept-Language on the first visit (nl → Dutch, else English)
//   and remembers the result in the `lang` cookie; later visits follow it.
// - `?lang=nl|en` (the NL | EN switch) stores that choice, then redirects to
//   the clean URL.
// - `/account` 302s to account.appelent.nl; www.appelent.nl 301s to the apex.
// - Unknown paths get the 404 page of the visitor's language, status 404.
// - Cache and security headers on every response. Icon caching follows the
//   developer-home apex-favicon Worker (a day), which this Worker absorbs.

import {
  fallbackLocale,
  isLocale,
  type Locale,
  localeCookie,
  locales,
  resolveLocale,
} from './i18n/core.ts'
import { accountUrl, notFoundPaths, pagePaths } from './routes.ts'

export interface Env {
  ASSETS: Fetcher
  /** "on" on production; anything else adds noindex (staging). */
  INDEXING?: string
}

const apexHost = 'appelent.nl'
const wwwHost = 'www.appelent.nl'
const cookieMaxAge = 60 * 60 * 24 * 365

const iconPaths = new Set([
  '/favicon.ico',
  '/favicon.png',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-512.png',
])

const securityHeaders: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
} satisfies ExportedHandler<Env>

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  if (url.hostname === wwwHost) {
    return finish(
      redirect(`https://${apexHost}${url.pathname}${url.search}`, 301),
      env,
    )
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return finish(
      new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' },
      }),
      env,
    )
  }

  const path = url.pathname

  if (url.searchParams.has('lang')) {
    const choice = url.searchParams.get('lang')
    url.searchParams.delete('lang')
    const response = redirect(`${path}${url.search}`, 302)
    if (isLocale(locales, choice)) setLocaleCookie(response, choice)
    response.headers.set('Cache-Control', 'no-store')
    return finish(response, env)
  }

  if (path === '/account' || path === '/account/') {
    return finish(redirect(accountUrl, 302), env)
  }

  if (path === '/robots.txt') return finish(robots(url, env), env)

  if (path === pagePaths.home.nl) return finish(await home(request, env), env)

  // The 404 pages exist as files only for the Worker to serve.
  if (
    Object.values(notFoundPaths).some((p) => path === p || path === `${p}.html`)
  ) {
    return finish(await notFound(request, env), env)
  }

  const response = await env.ASSETS.fetch(request)
  if (response.status === 404) return finish(await notFound(request, env), env)
  return finish(withCache(response, path), env)
}

/** `/`: the cookie when set, else Accept-Language on this first visit. */
async function home(request: Request, env: Env): Promise<Response> {
  const remembered = readCookie(request, localeCookie)
  const locale = resolveLocale(
    locales,
    fallbackLocale,
    remembered,
    request.headers.get('Accept-Language') ?? undefined,
  )
  const response =
    locale === 'nl'
      ? copy(await env.ASSETS.fetch(request))
      : redirect(pagePaths.home[locale], 302)
  if (!isLocale(locales, remembered)) setLocaleCookie(response, locale)
  response.headers.set('Cache-Control', 'private, no-cache')
  response.headers.set('Vary', 'Accept-Language, Cookie')
  return response
}

async function notFound(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const locale: Locale =
    url.pathname === '/en' || url.pathname.startsWith('/en/')
      ? 'en'
      : resolveLocale(
          locales,
          fallbackLocale,
          readCookie(request, localeCookie),
          request.headers.get('Accept-Language') ?? undefined,
        )
  const page = await env.ASSETS.fetch(
    new Request(new URL(notFoundPaths[locale], url), {
      method: request.method,
    }),
  )
  const response = new Response(page.body, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
  response.headers.set('Cache-Control', 'no-cache')
  return response
}

function robots(url: URL, env: Env): Response {
  const body =
    env.INDEXING === 'on'
      ? `User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n'
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function withCache(response: Response, path: string): Response {
  const out = copy(response)
  if (!response.ok) return out
  if (path.startsWith('/assets/')) {
    out.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (iconPaths.has(path)) {
    out.headers.set('Cache-Control', 'public, max-age=86400')
  } else {
    out.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  }
  return out
}

/** Security headers everywhere, and noindex off production. */
function finish(response: Response, env: Env): Response {
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value)
  }
  if (env.INDEXING !== 'on') response.headers.set('X-Robots-Tag', 'noindex')
  return response
}

function copy(response: Response): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  })
}

function redirect(location: string, status: 301 | 302): Response {
  return new Response(null, { status, headers: { Location: location } })
}

function setLocaleCookie(response: Response, locale: Locale): void {
  response.headers.append(
    'Set-Cookie',
    `${localeCookie}=${locale}; Path=/; Max-Age=${cookieMaxAge}; SameSite=Lax; Secure`,
  )
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('Cookie')
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}
