// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// JSONC: drop comments before parsing (no string in this file contains //).
const config = JSON.parse(
  readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, ''),
)

describe('wrangler.jsonc', () => {
  it('gives production no routes: APP-481 ships staging only', () => {
    expect(config.name).toBe('appelent-account')
    expect(config.routes).toBeUndefined()
    expect(config.route).toBeUndefined()
    expect(config.workers_dev).toBe(false)
  })

  it('puts staging on account-stg.appelent.nl only', () => {
    expect(config.env.staging.name).toBe('appelent-account-staging')
    expect(config.env.staging.routes).toEqual([
      { pattern: 'account-stg.appelent.nl', custom_domain: true },
    ])
    expect(Object.keys(config.env)).toEqual(['staging'])
  })
})
