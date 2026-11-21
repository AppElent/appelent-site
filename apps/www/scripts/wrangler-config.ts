// Reads wrangler.jsonc (JSON with comments) for the deploy guard and tests.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Route {
  pattern: string
  custom_domain?: boolean
  zone_name?: string
}

export interface WorkerConfig {
  name: string
  routes?: Route[]
  route?: string | Route
  vars?: Record<string, string>
  workers_dev?: boolean
  env?: Record<string, Omit<WorkerConfig, 'env'>>
}

const file = join(dirname(fileURLToPath(import.meta.url)), '../wrangler.jsonc')

/** Strips // and /* *\/ comments outside strings, then trailing commas. */
export function parseJsonc(text: string): unknown {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inString) {
      out += ch
      if (ch === '\\') out += text[++i] ?? ''
      else if (ch === '"') inString = false
    } else if (ch === '"') {
      inString = true
      out += ch
    } else if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
      out += '\n'
    } else if (ch === '/' && next === '*') {
      i = text.indexOf('*/', i + 2) + 1
    } else {
      out += ch
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'))
}

export function readWranglerConfig(): WorkerConfig {
  return parseJsonc(readFileSync(file, 'utf8')) as WorkerConfig
}

/** The Worker that `wrangler deploy [--env <environment>]` would deploy. */
export function workerFor(
  config: WorkerConfig,
  environment: string | undefined,
): Omit<WorkerConfig, 'env'> {
  if (!environment || environment === 'production') return config
  const env = config.env?.[environment]
  if (!env) throw new Error(`wrangler.jsonc has no env.${environment}`)
  return env
}

/** Hosts that belong to the production cutover, not to phase 1. */
export const productionHosts = ['appelent.nl', 'www.appelent.nl']

export function routedHosts(worker: Omit<WorkerConfig, 'env'>): string[] {
  const routes = [
    ...(worker.routes ?? []),
    ...(worker.route ? [worker.route] : []),
  ]
  return routes.map((route) => {
    const pattern = typeof route === 'string' ? route : route.pattern
    return pattern.replace(/^https?:\/\//, '').split('/')[0] ?? ''
  })
}

/** Every config block (top level and each env) that routes a production host. */
export function productionRouteViolations(config: WorkerConfig): string[] {
  const blocks: [string, Omit<WorkerConfig, 'env'>][] = [
    ['top level', config],
    ...Object.entries(config.env ?? {}).map(
      ([name, env]) =>
        [`env.${name}`, env] as [string, Omit<WorkerConfig, 'env'>],
    ),
  ]
  return blocks.flatMap(([where, worker]) =>
    routedHosts(worker)
      .filter((host) =>
        productionHosts.some(
          (p) => host === p || host === `*.${p}` || host === '*',
        ),
      )
      .map((host) => `${where} routes ${host}`),
  )
}
