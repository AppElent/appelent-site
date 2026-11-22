// The portal's Content-Security-Policy: this origin, Clerk, and the four app
// Convex deployments. No other third party. Built from the same public build
// values the browser uses (src/config.ts), so the two cannot drift.

/** The Clerk Frontend API host encoded in a publishable key (`pk_<env>_<base64(host$)>`). */
export function clerkFrontendHost(publishableKey: string): string | null {
  const match = /^pk_(test|live)_([A-Za-z0-9+/=_-]+)$/.exec(publishableKey)
  if (!match?.[2]) return null
  try {
    const decoded = atob(match[2].replace(/-/g, '+').replace(/_/g, '/'))
    const host = decoded.endsWith('$') ? decoded.slice(0, -1) : decoded
    return /^[a-z0-9.-]+$/i.test(host) ? host : null
  } catch {
    return null
  }
}

export function convexHost(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? parsed.host : null
  } catch {
    return null
  }
}

export function buildCsp(options: {
  nonce: string
  clerkHost: string | null
  convexHosts: (string | null)[]
  /** Vite's dev server needs its HMR socket and inline module preamble. */
  dev?: boolean
}): string {
  const clerk = options.clerkHost ? [`https://${options.clerkHost}`] : []
  // Clerk's own bot and abuse protection (developer-home auth standard; Clerk's
  // CSP guide). Loaded by Clerk only, never by this app's code.
  const clerkProtect = [
    'https://challenges.cloudflare.com',
    'https://*.protect.clerk.com',
  ]
  const convex = options.convexHosts.flatMap((host) =>
    host ? [`https://${host}`] : [],
  )
  const dev = options.dev ? ["'unsafe-eval'"] : []
  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      ["'self'", `'nonce-${options.nonce}'`, ...clerk, ...clerkProtect, ...dev],
    ],
    [
      'connect-src',
      [
        "'self'",
        ...clerk,
        'https://*.protect.clerk.com:*',
        ...convex,
        ...(options.dev ? ['ws:'] : []),
      ],
    ],
    // Clerk renders its components with runtime CSS-in-JS.
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', 'https://img.clerk.com']],
    ['font-src', ["'self'"]],
    ['worker-src', ["'self'", 'blob:']],
    [
      'frame-src',
      ['https://challenges.cloudflare.com', 'https://*.protect.clerk.com'],
    ],
    ['form-action', ["'self'", ...clerk]],
    ['base-uri', ["'none'"]],
    ['object-src', ["'none'"]],
    ['frame-ancestors', ["'none'"]],
  ]
  return directives
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')
}

export const securityHeaders: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'X-Frame-Options': 'DENY',
}
