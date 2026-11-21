// Deploy guard (developer-home standards/deployments.md, "Guard Worker name"):
//   node scripts/guard-worker.ts <environment> <expected-worker>
// Fails when the Worker wrangler would deploy for <environment> is not
// <expected-worker>, and, in phase 1 of APP-480, when any config block routes
// appelent.nl or www.appelent.nl. Remove that second check in the production
// cutover change, not before.

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
    `wrangler.jsonc ${violation}: production hosts wait for the cutover (APP-480 phase 2).`,
  )
}
if (errors.length) {
  for (const error of errors) console.error(`::error::${error}`)
  process.exit(1)
}
console.log(
  `Deploying ${worker.name} (${environment}) to ${routedHosts(worker).join(', ') || 'no routes'}.`,
)
