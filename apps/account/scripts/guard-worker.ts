// Deploy guard (developer-home standards/deployments.md, "Guard Worker name"):
//   node scripts/guard-worker.ts <expected-worker>
// Run after `CLOUDFLARE_ENV=<env> pnpm build`. Fails when the built Worker
// (dist/server/wrangler.json, what `wrangler deploy` ships) is not
// <expected-worker>, or when its routes are not exactly that Worker's own
// custom domain (a staging build must never take over account.appelent.nl).
import { readFileSync } from 'node:fs'

interface Route {
  pattern: string
  custom_domain?: boolean
}
interface WorkerConfig {
  name?: string
  workers_dev?: boolean
  preview_urls?: boolean
  routes?: (Route | string)[]
  route?: Route | string
}

/** The only routes each deployable Worker may have. */
const ALLOWED_ROUTES: Record<string, string[]> = {
  'appelent-account': ['account.appelent.nl'],
  'appelent-account-staging': ['account-stg.appelent.nl'],
}

const expected = process.argv[2]
if (!expected) {
  console.error('Usage: node scripts/guard-worker.ts <expected-worker>')
  process.exit(2)
}

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const hosts = (config: WorkerConfig) =>
  [...(config.routes ?? []), ...(config.route ? [config.route] : [])].map(
    (route) =>
      (typeof route === 'string' ? route : route.pattern).replace(/\/.*$/, ''),
  )

const errors: string[] = []
let built: WorkerConfig = {}
try {
  built = JSON.parse(read('dist/server/wrangler.json')) as WorkerConfig
} catch {
  errors.push('dist/server/wrangler.json is missing: run the build first.')
}
if (built.name !== expected) {
  errors.push(`Built Worker is ${built.name}, expected ${expected}.`)
}
const allowed = ALLOWED_ROUTES[expected]
const routes = [...(built.routes ?? []), ...(built.route ? [built.route] : [])]
const exact =
  allowed !== undefined &&
  routes.length === allowed.length &&
  routes.every(
    (route, i) =>
      typeof route !== 'string' &&
      route.custom_domain === true &&
      route.pattern === allowed[i],
  )
if (!exact) {
  errors.push(
    `Built Worker routes ${JSON.stringify(routes)}, expected exactly the custom domain(s) ${JSON.stringify(allowed ?? [])}.`,
  )
}
if (built.workers_dev !== false || built.preview_urls !== false) {
  errors.push(
    'The built Worker must set workers_dev and preview_urls to false.',
  )
}
if (errors.length) {
  for (const error of errors) console.error(`::error::${error}`)
  process.exit(1)
}
console.log(
  `Deploying ${built.name} to ${hosts(built).join(', ') || 'no routes'}.`,
)
