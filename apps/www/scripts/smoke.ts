// Smoke-checks a deployed origin (developer-home standards/deployments.md):
//   node scripts/smoke.ts https://www-stg.appelent.nl [expected-commit]
// Checks the routes and statuses from designs/site/site_final.md and, when a
// commit is given, that /version.json reports it. Retries while the edge
// catches up, then fails with every mismatch.

interface Check {
  path: string
  headers?: Record<string, string>
  status: number
  location?: string
  contains?: string
}

const checks: Check[] = [
  {
    path: '/',
    headers: { 'Accept-Language': 'nl-NL,nl;q=0.9' },
    status: 200,
    contains: '<html lang="nl">',
  },
  {
    path: '/',
    headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    status: 302,
    location: '/en/',
  },
  { path: '/en/', status: 200, contains: '<html lang="en">' },
  { path: '/privacy', status: 200, contains: 'id="app-gather"' },
  { path: '/en/privacy', status: 200, contains: 'id="app-arcade"' },
  { path: '/support', status: 200, contains: 'hreflang="en"' },
  { path: '/en/support', status: 200, contains: 'hreflang="nl"' },
  { path: '/account', status: 302, location: 'https://account.appelent.nl' },
  { path: '/?lang=en', status: 302, location: '/' },
  {
    path: '/does-not-exist',
    headers: { 'Accept-Language': 'nl' },
    status: 404,
    contains: '<html lang="nl">',
  },
  { path: '/en/does-not-exist', status: 404, contains: '<html lang="en">' },
  { path: '/favicon.ico', status: 200 },
  { path: '/apple-touch-icon.png', status: 200 },
]

async function run(
  origin: string,
  commit: string | undefined,
): Promise<string[]> {
  const failures: string[] = []
  for (const check of checks) {
    const res = await fetch(origin + check.path, {
      headers: check.headers,
      redirect: 'manual',
    })
    const body = await res.text()
    const label = `${check.path}${check.headers ? ` (${Object.values(check.headers).join(' ')})` : ''}`
    if (res.status !== check.status) {
      failures.push(`${label}: status ${res.status}, expected ${check.status}`)
    } else if (
      check.location &&
      res.headers.get('location') !== check.location
    ) {
      failures.push(
        `${label}: location ${res.headers.get('location')}, expected ${check.location}`,
      )
    } else if (check.contains && !body.includes(check.contains)) {
      failures.push(`${label}: body lacks ${check.contains}`)
    } else {
      console.log(`ok ${res.status} ${label}`)
    }
  }
  if (commit) {
    const res = await fetch(`${origin}/version.json`, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    const reported = res.ok
      ? ((await res.json()) as { commit?: string }).commit
      : undefined
    if (reported !== commit)
      failures.push(`/version.json: commit ${reported}, expected ${commit}`)
    else console.log(`ok version ${commit}`)
  }
  return failures
}

const [origin, commit] = process.argv.slice(2)
if (!origin) {
  console.error('Usage: node scripts/smoke.ts <origin> [expected-commit]')
  process.exit(2)
}

let failures: string[] = []
for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    failures = await run(origin.replace(/\/$/, ''), commit)
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
