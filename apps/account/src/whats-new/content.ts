// The committed digests (`content/whats-new/<app>/<yyyy>-W<ww>.json`) and
// their screenshots, bundled at build time. Screenshots become hashed assets
// on this origin, so the CSP's `img-src 'self'` covers them.
import { type AppId, isAppId } from '../portal/apps.ts'
import { parseWeek, type WeekDigest } from './digest.ts'

const files = import.meta.glob<unknown>(
  '../../../../content/whats-new/*/*-W*.json',
  { eager: true, import: 'default' },
)
const images = import.meta.glob<string>(
  '../../../../content/whats-new/*/img/*.{webp,jpg}',
  { eager: true, query: '?url', import: 'default' },
)

const PATH = /\/whats-new\/([a-z]+)\/(?:img\/)?([^/]+)$/

/** Groups week files per app; a file that does not validate is left out. */
export function loadDigests(
  raw: Record<string, unknown>,
): Record<AppId, WeekDigest[]> {
  const out: Record<AppId, WeekDigest[]> = {
    gather: [],
    foundry: [],
    fairway: [],
    arcade: [],
  }
  for (const [path, json] of Object.entries(raw)) {
    const match = PATH.exec(path)
    if (!match?.[1] || !match[2] || !isAppId(match[1])) continue
    const { digest, problems } = parseWeek(
      json,
      match[2].replace(/\.json$/, ''),
    )
    if (problems.length === 0) out[match[1]].push(digest)
  }
  for (const list of Object.values(out))
    list.sort((a, b) => b.week.localeCompare(a.week))
  return out
}

/** `<app>/<file>` → URL, for the screenshots. */
export function imageUrls(raw: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>()
  for (const [path, url] of Object.entries(raw)) {
    const match = PATH.exec(path)
    if (match?.[1] && match[2]) map.set(`${match[1]}/${match[2]}`, url)
  }
  return map
}

export const digests = loadDigests(files)
const urls = imageUrls(images)
export const screenshotUrl = (app: AppId, file: string) =>
  urls.get(`${app}/${file}`) ?? null
