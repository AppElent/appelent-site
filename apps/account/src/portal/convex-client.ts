// The real per-app client: one ConvexHttpClient per app deployment, signed in
// with the shared Clerk session's `convex` token. No WebSocket: the portal
// only makes one-shot reads, and the CSP then allows https to the four hosts.
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { ConvexError } from 'convex/values'
import {
  type ExportPage,
  type PortalClient,
  parseExportPage,
  parseSummary,
  type Summary,
} from './contract.ts'

/** `fresh`: skip Clerk's token cache (after an app refused the last one). */
export type TokenSource = (fresh?: boolean) => Promise<string | null>

/**
 * Convex itself refusing the token (HTTP 401, for example a token that
 * expired in transit) before any app code runs. The SDK would turn this into
 * a plain `Error`, so the client's fetch marks it.
 */
export class TokenRejected extends Error {
  override name = 'TokenRejected'
}

/** Fetch for the SDK: a 401 becomes `TokenRejected`, everything else passes. */
export const markTokenRejected: typeof fetch = async (input, init) => {
  const response = await globalThis.fetch(input, init)
  if (response.status === 401) throw new TokenRejected(await response.text())
  return response
}

/**
 * An app saying the caller is not signed in: Foundry's `unauthenticated`
 * code, Gather's `Not authenticated`, or Convex's 401. A cached token can
 * expire between Clerk and the app, so this earns one retry with a fresh token.
 */
export function isUnauthenticated(error: unknown): boolean {
  if (error instanceof TokenRejected) return true
  if (!(error instanceof ConvexError)) return false
  const data: unknown = error.data
  if (data === 'Not authenticated' || data === 'unauthenticated') return true
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { code?: unknown }).code === 'unauthenticated'
  )
}

/** The `sub` claim of a JWT, without verifying it (the app does that). */
export function tokenSubject(jwt: string | null): string | null {
  const payload = jwt?.split('.')[1]
  if (!payload) return null
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const sub: unknown = (JSON.parse(json) as { sub?: unknown }).sub
    return typeof sub === 'string' ? sub : null
  } catch {
    return null
  }
}

/**
 * Only `owner`'s tokens: if another account becomes active mid-export, its
 * token is never sent with this account's cursor; the call fails as "no
 * token" instead.
 */
export function ownTokens(
  owner: string | null,
  source: TokenSource,
): TokenSource {
  return async (fresh) => {
    const jwt = await source(fresh)
    return owner !== null && tokenSubject(jwt) === owner ? jwt : null
  }
}

const summaryRef = makeFunctionReference<'query', Record<string, never>>(
  'accountPortal:summary',
)
const exportPageRef = makeFunctionReference<'query', { cursor: string | null }>(
  'accountPortal:exportPage',
)

/** A call slower than this counts as unreachable. */
export const CALL_TIMEOUT_MS = 20_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function createConvexPortalClient(
  app: string,
  url: string,
  getToken: TokenSource,
): PortalClient {
  const client = new ConvexHttpClient(url, {
    logger: false,
    fetch: markTokenRejected,
  })
  function call<T>(run: () => Promise<T>): Promise<T> {
    // One deadline over the token and the query: a stalled token refresh is
    // as unreachable as a stalled app, and a late token starts nothing.
    let expired = false
    const once = async (fresh: boolean) => {
      const token = await getToken(fresh)
      if (expired) throw new Error('Timed out')
      // Never call an app anonymously: every portal function resolves the
      // caller from the token.
      if (!token) throw new Error('No Clerk session token')
      client.setAuth(token)
      return run()
    }
    const attempt = async () => {
      try {
        return await once(false)
      } catch (error) {
        if (expired || !isUnauthenticated(error)) throw error
        return once(true)
      }
    }
    return withTimeout(attempt(), CALL_TIMEOUT_MS).catch((error: unknown) => {
      expired = true
      throw error
    })
  }
  return {
    async summary(): Promise<Summary | null> {
      return parseSummary(await call(() => client.query(summaryRef, {})))
    },
    async exportPage(cursor: string | null): Promise<ExportPage> {
      return parseExportPage(
        await call(() => client.query(exportPageRef, { cursor })),
        app,
      )
    },
  }
}
