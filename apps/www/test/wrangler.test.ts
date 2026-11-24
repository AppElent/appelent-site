import { describe, expect, it } from 'vitest'
import {
  parseJsonc,
  productionRouteViolations,
  readWranglerConfig,
  routedHosts,
  type WorkerConfig,
  workerFor,
} from '../scripts/wrangler-config.ts'

const config = readWranglerConfig()

describe('wrangler.jsonc', () => {
  it('deploys staging as appelent-www-staging on www-stg.appelent.nl only', () => {
    const staging = workerFor(config, 'staging')
    expect(staging.name).toBe('appelent-www-staging')
    expect(routedHosts(staging)).toEqual(['www-stg.appelent.nl'])
    expect(staging.vars?.INDEXING).toBe('off')
  })

  it('deploys production as appelent-www on the apex and www only', () => {
    const production = workerFor(config, 'production')
    expect(production.name).toBe('appelent-www')
    expect(routedHosts(production)).toEqual(['appelent.nl', 'www.appelent.nl'])
    expect(production.vars?.INDEXING).toBe('on')
    expect(productionRouteViolations(config)).toEqual([])
  })

  it('catches a production host outside the production block', () => {
    const bad: WorkerConfig = {
      name: 'x',
      routes: [{ pattern: 'appelent.nl/*', zone_name: 'appelent.nl' }],
      env: {
        staging: {
          name: 'y',
          routes: [{ pattern: 'www.appelent.nl', custom_domain: true }],
        },
      },
    }
    expect(productionRouteViolations(bad)).toEqual([
      'env.staging routes www.appelent.nl',
    ])
  })

  it('parses comments without touching strings', () => {
    expect(
      parseJsonc('{\n // c\n "a": "http://x/*y*/", /* b */ "b": [1,],\n}'),
    ).toEqual({ a: 'http://x/*y*/', b: [1] })
  })
})
