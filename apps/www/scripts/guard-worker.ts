// Deploy guard (developer-home standards/deployments.md, "Guard Worker name"):
//   node scripts/guard-worker.ts <environment> <expected-worker>
// Fails when the Worker wrangler would deploy for <environment> is not
// <expected-worker>, and when any env block other than production routes
// appelent.nl or www.appelent.nl (a staging deploy must never take the apex).

import {
  productionRouteViolations,
  readWranglerConfig,
  routedHosts,
  workerFor,
} from './wrangler-config.ts'

const [environment, expected] = process.argv.slice(2)
if (!environment || !expected) {
  console.error(
    'Usage: node scripts/guard-worker.ts <environment> <expected-worker>',
  )
  process.exit(2)
}

const config = readWranglerConfig()
const worker = workerFor(config, environment)
const errors: string[] = []
if (worker.name !== expected) {
  errors.push(`Built Worker is ${worker.name}, expected ${expected}.`)
}
for (const violation of productionRouteViolations(config)) {
  errors.push(
    `wrangler.jsonc ${violation}: only the production Worker may route a production host.`,
  )
}
if (errors.length) {
  for (const error of errors) console.error(`::error::${error}`)
  process.exit(1)
}
console.log(
  `Deploying ${worker.name} (${environment}) to ${routedHosts(worker).join(', ') || 'no routes'}.`,
)
