// The real per-app client: one ConvexHttpClient per app deployment, signed in
// with the shared Clerk session's `convex` token. No WebSocket: the portal
// only makes one-shot reads, and the CSP then allows https to the four hosts.
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import {
  type ExportPage,
  type PortalClient,
  parseExportPage,
  parseSummary,
  type Summary,
} from './contract.ts'

export type TokenSource = () => Promise<string | null>

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
  const client = new ConvexHttpClient(url, { logger: false })
  function call<T>(run: () => Promise<T>): Promise<T> {
    // One deadline over the token and the query: a stalled token refresh is
    // as unreachable as a stalled app, and a late token starts nothing.
    let expired = false
    const attempt = async () => {
      const token = await getToken()
      if (expired) throw new Error('Timed out')
      // Never call an app anonymously: every portal function resolves the
      // caller from the token.
      if (!token) throw new Error('No Clerk session token')
      client.setAuth(token)
      return run()
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
