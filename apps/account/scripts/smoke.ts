// Smoke-checks a running portal (developer-home standards/deployments.md):
//   node scripts/smoke.ts https://account-stg.appelent.nl
// Signed-out checks only: every route renders in both languages, unknown paths
// are 404s, and every page carries the strict CSP and security headers.
// Retries while the edge catches up, then fails with every mismatch.

export {}

interface Check {
  path: string
  cookie?: string
  status: number
  contains?: string
}

const checks: Check[] = [
  { path: '/sign-in', status: 200, contains: '<html lang="nl"' },
  {
    path: '/sign-in',
    cookie: 'lang=en',
    status: 200,
    contains: '<html lang="en"',
  },
  { path: '/', status: 200 },
  { path: '/export', status: 200 },
  { path: '/apps/gather', status: 200 },
  { path: '/profiel', status: 200 },
  { path: '/profile', cookie: 'lang=en', status: 200 },
  { path: '/apps/nope', status: 404 },
  { path: '/does-not-exist', status: 404, contains: '<html lang="nl"' },
  {
    path: '/does-not-exist',
    cookie: 'lang=en',
    status: 404,
    contains: '<html lang="en"',
  },
]

const assets = ['/favicon.ico', '/apple-touch-icon.png']

function headerProblems(res: Response): string[] {
  const problems: string[] = []
  const csp = res.headers.get('content-security-policy') ?? ''
  const script = /(?:^|;\s*)script-src ([^;]*)/.exec(csp)?.[1] ?? ''
  if (!/'nonce-[A-Za-z0-9+/=]+'/.test(script))
    problems.push('CSP script-src has no nonce')
  if (script.includes("'unsafe-inline'") || script.includes("'unsafe-eval'")) {
    problems.push('CSP script-src allows unsafe scripts')
  }
  if (!csp.includes("frame-ancestors 'none'"))
    problems.push("CSP lacks frame-ancestors 'none'")
  if (res.headers.get('x-frame-options') !== 'DENY')
    problems.push('X-Frame-Options is not DENY')
  if (res.headers.get('x-content-type-options') !== 'nosniff')
    problems.push('nosniff missing')
  if (!res.headers.get('cache-control')?.includes('no-store'))
    problems.push('page is cacheable')
  return problems
}

async function run(origin: string): Promise<string[]> {
  const failures: string[] = []
  for (const check of checks) {
    const res = await fetch(origin + check.path, {
      headers: check.cookie ? { Cookie: check.cookie } : {},
      redirect: 'manual',
    })
    const body = await res.text()
    const label = `${check.path}${check.cookie ? ` (${check.cookie})` : ''}`
    const problems = headerProblems(res)
    if (res.status !== check.status) {
      failures.push(`${label}: status ${res.status}, expected ${check.status}`)
    } else if (check.contains && !body.includes(check.contains)) {
      failures.push(`${label}: body lacks ${check.contains}`)
    } else if (problems.length) {
      failures.push(`${label}: ${problems.join('; ')}`)
    } else {
      console.log(`ok ${res.status} ${label}`)
    }
  }
  for (const path of assets) {
    const res = await fetch(origin + path)
    await res.arrayBuffer()
    if (res.status !== 200) failures.push(`${path}: status ${res.status}`)
    else console.log(`ok 200 ${path}`)
  }
  return failures
}

const [origin] = process.argv.slice(2)
if (!origin) {
  console.error('Usage: node scripts/smoke.ts <origin>')
  process.exit(2)
}

let failures: string[] = []
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    failures = await run(origin.replace(/\/$/, ''))
  } catch (error) {
    failures = [`${origin}: ${(error as Error).message}`]
  }
  if (!failures.length) break
  console.log(`Attempt ${attempt} failed; retrying in 5s.`)
  await new Promise((resolve) => setTimeout(resolve, 5000))
}
if (failures.length) {
  for (const failure of failures) console.error(`::error::${failure}`)
  process.exit(1)
}
console.log(`Smoke check passed for ${origin}.`)
