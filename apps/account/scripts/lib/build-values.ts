// Build-time checks and outputs for apps/account (APP-608), used by
// vite.config.ts. Plain functions so test/build-values.test.ts covers them.
import type { Plugin } from 'vite'

/** The build values that name each app's Convex deployment. */
export const CONVEX_URL_NAMES = [
  'VITE_GATHER_CONVEX_URL',
  'VITE_FOUNDRY_CONVEX_URL',
  'VITE_FAIRWAY_CONVEX_URL',
  'VITE_ARCADE_CONVEX_URL',
] as const

/** `https://<deployment>.<region>.convex.cloud`, no path or trailing slash. */
const CONVEX_URL = /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)?\.convex\.cloud$/

/**
 * Every Convex URL that is set must be a Convex deployment origin. A wrong
 * one would ship a portal whose CSP blocks that app. Presence is checked by
 * `env.mjs check`: CI builds without any.
 */
export function convexUrlProblems(
  env: Record<string, string | undefined>,
): string[] {
  const problems: string[] = []
  for (const name of CONVEX_URL_NAMES) {
    const value = env[name]
    if (value === undefined || value === '') continue
    if (!CONVEX_URL.test(value))
      problems.push(
        `${name} is "${value}": expected https://<deployment>.<region>.convex.cloud`,
      )
  }
  const set = CONVEX_URL_NAMES.map((n) => env[n]).filter(Boolean)
  if (new Set(set).size !== set.length)
    problems.push('Two apps share one Convex URL')
  return problems
}

/** What /version.json says: the commit the deploy built. */
export const versionJson = (env: Record<string, string | undefined>) =>
  `${JSON.stringify({ commit: env.GITHUB_SHA ?? 'local' })}\n`

/**
 * Fails the build on a malformed Convex URL, and writes version.json into the
 * client assets so the smoke check can confirm what is live.
 */
export function buildValues(
  env: Record<string, string | undefined> = process.env,
): Plugin {
  return {
    name: 'appelent-account-build-values',
    apply: 'build',
    buildStart() {
      const problems = convexUrlProblems(env)
      if (problems.length)
        this.error(`Build values:\n  ${problems.join('\n  ')}`)
    },
    generateBundle() {
      if (this.environment.name !== 'client') return
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionJson(env),
      })
    },
  }
}
