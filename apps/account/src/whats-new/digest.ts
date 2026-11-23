// "What's new" (APP-628): a written weekly digest per app, stored as
// `content/whats-new/<app>/<yyyy>-W<ww>.json` with its screenshots beside it
// in `img/`. Pure: the portal (content.ts) and the maintainer script
// (scripts/whats-new.ts) both parse and filter through here.
import type { Locale } from '../i18n/core.ts'

export type Localized = Record<Locale, string>

/** How far a week's changes got for everyone: web app, app update, store. */
export const stages = ['web', 'app', 'store'] as const
export type Stage = (typeof stages)[number]

export interface Screenshot {
  /** File name in the app's `img/` folder. */
  file: string
  width: number
  height: number
  alt: Localized
}

export interface NewItem {
  title: Localized
  body: Localized
  screenshots: Screenshot[]
}

export interface WeekDigest {
  /** ISO week, `2026-W47`; the file is named after it. */
  week: string
  /** The stage every change of the week reached; null: not out yet. */
  stage: Stage | null
  /** `YYYY-MM-DD` the week reached that stage, when known. */
  since: string | null
  /** Semver of the release the week belongs to, when known. */
  version: string | null
  /** The version is not in the App Store yet. */
  unreleased: boolean
  new: NewItem[]
  fixed: Localized[]
}

export const MAX_SCREENSHOT_BYTES = 150_000
const WEEK = /^(\d{4})-W(\d{2})$/
const DAY = /^\d{4}-\d{2}-\d{2}$/
const SEMVER = /^\d+\.\d+\.\d+$/
const IMAGE = /^[a-z0-9][a-z0-9-]*\.(webp|jpg)$/

export const isDay = (value: unknown): value is string =>
  typeof value === 'string' &&
  DAY.test(value) &&
  !Number.isNaN(Date.parse(value))

/** Monday of an ISO week, as `YYYY-MM-DD`. */
export function weekStart(week: string): string {
  const match = WEEK.exec(week)
  if (!match) throw new Error(`Not an ISO week: ${week}`)
  const year = Number(match[1])
  const jan4 = Date.UTC(year, 0, 4)
  const monday1 = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * 86_400_000
  const ms = monday1 + (Number(match[2]) - 1) * 7 * 86_400_000
  return new Date(ms).toISOString().slice(0, 10)
}

/** Sunday of an ISO week, as `YYYY-MM-DD`. */
export const weekEnd = (week: string) =>
  new Date(Date.parse(weekStart(week)) + 6 * 86_400_000)
    .toISOString()
    .slice(0, 10)

/** The ISO week a moment falls in (UTC), `2026-W47`. */
export function isoWeek(at: string | number | Date): string {
  const date = new Date(at)
  const day = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  )
  // The Thursday of this week decides the year.
  const thursday = new Date(
    day + (3 - ((new Date(day).getUTCDay() + 6) % 7)) * 86_400_000,
  )
  const year = thursday.getUTCFullYear()
  const week =
    Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 / 7) + 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** Semver compare, newest first when sorting with `(a, b) => compare(b, a)`. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

/** "1.1.0" reads "1.1"; a patch release keeps its patch. */
export const shortVersion = (version: string) =>
  version.endsWith('.0') ? version.slice(0, -2) : version

// ---------- Parsing ----------

type Problems = string[]

function localized(value: unknown, where: string, problems: Problems) {
  const v = value as Partial<Localized> | null
  if (
    typeof v !== 'object' ||
    v === null ||
    typeof v.nl !== 'string' ||
    typeof v.en !== 'string' ||
    !v.nl.trim() ||
    !v.en.trim()
  ) {
    problems.push(`${where}: needs non-empty "nl" and "en"`)
    return { nl: '', en: '' }
  }
  return { nl: v.nl, en: v.en }
}

/**
 * Validates one week file. Returns the digest and every problem found, so the
 * content test can list them all; the portal drops a file with problems.
 */
export function parseWeek(
  raw: unknown,
  week: string,
): { digest: WeekDigest; problems: string[] } {
  const problems: Problems = []
  const r = (raw ?? {}) as Record<string, unknown>
  if (!WEEK.test(week)) problems.push(`file name: "${week}" is not YYYY-Www`)
  if (r.week !== week) problems.push(`week: must be "${week}"`)
  /** The value when `ok`, else null and a problem. */
  const check = <T>(value: unknown, ok: boolean, problem: string) => {
    if (ok) return value as T
    problems.push(problem)
    return null
  }
  const stage = check<Stage | null>(
    r.stage,
    r.stage === null || stages.includes(r.stage as Stage),
    'stage: web, app, store or null',
  )
  const since = check<string | null>(
    r.since,
    r.since === null || isDay(r.since),
    'since: YYYY-MM-DD or null',
  )
  const version = check<string | null>(
    r.version,
    r.version === null ||
      (typeof r.version === 'string' && SEMVER.test(r.version)),
    'version: x.y.z or null',
  )
  if (typeof r.unreleased !== 'boolean') problems.push('unreleased: boolean')
  const news = Array.isArray(r.new) ? r.new : []
  if (!Array.isArray(r.new)) problems.push('new: must be a list')
  const fixedRaw = Array.isArray(r.fixed) ? r.fixed : []
  if (!Array.isArray(r.fixed)) problems.push('fixed: must be a list')
  if (news.length + fixedRaw.length === 0) problems.push('the week is empty')
  if (news.length > 6) problems.push('new: at most 6 items')

  const digest: WeekDigest = {
    week,
    stage,
    since,
    version,
    unreleased: r.unreleased === true,
    new: news.map((item: unknown, i: number) => {
      const it = (item ?? {}) as Record<string, unknown>
      const shots = Array.isArray(it.screenshots) ? it.screenshots : []
      if (!Array.isArray(it.screenshots))
        problems.push(`new[${i}].screenshots: must be a list`)
      if (shots.length > 2) problems.push(`new[${i}]: at most 2 screenshots`)
      return {
        title: localized(it.title, `new[${i}].title`, problems),
        body: localized(it.body, `new[${i}].body`, problems),
        screenshots: shots.map((shot: unknown, j: number) => {
          const s = (shot ?? {}) as Record<string, unknown>
          const where = `new[${i}].screenshots[${j}]`
          if (typeof s.file !== 'string' || !IMAGE.test(s.file))
            problems.push(`${where}.file: a .webp or .jpg name in img/`)
          for (const key of ['width', 'height'] as const) {
            const n = s[key]
            if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0)
              problems.push(`${where}.${key}: a positive integer`)
          }
          return {
            file: String(s.file),
            width: Number(s.width),
            height: Number(s.height),
            alt: localized(s.alt, `${where}.alt`, problems),
          }
        }),
      }
    }),
    fixed: fixedRaw.map((line: unknown, i: number) =>
      localized(line, `fixed[${i}]`, problems),
    ),
  }
  // The page keys items by their English text.
  const keys = [
    ...digest.new.map((n) => n.title.en),
    ...digest.fixed.map((f) => f.en),
  ]
  for (const key of new Set(keys.filter((k, i) => keys.indexOf(k) !== i)))
    problems.push(`"${key}": appears twice in the week`)
  for (const text of textOf(digest)) {
    const leak = leaks(text)
    if (leak) problems.push(`"${text}": ${leak}`)
  }
  return { digest, problems }
}

/** Every visible string of a digest. */
export function textOf(d: WeekDigest): string[] {
  return [
    ...d.new.flatMap((n) => [
      n.title.nl,
      n.title.en,
      n.body.nl,
      n.body.en,
      ...n.screenshots.flatMap((s) => [s.alt.nl, s.alt.en]),
    ]),
    ...d.fixed.flatMap((f) => [f.nl, f.en]),
  ]
}

/**
 * The page shows no PR numbers, Linear ids, links or addresses (APP-628,
 * "No personal info"). Returns why a string is not allowed, or null.
 */
export function leaks(text: string): string | null {
  if (/\b[A-Z]{2,5}-\d+\b/.test(text)) return 'looks like an issue id'
  if (/#\d+/.test(text)) return 'looks like a PR number'
  if (/https?:\/\/|www\./i.test(text)) return 'contains a link'
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) return 'contains an email address'
  return null
}

// ---------- Filters ----------

export type TypeFilter = 'all' | 'new' | 'fixed'

export interface Filters {
  type: TypeFilter
  /** A version, or null for all. */
  version: string | null
  /** `YYYY-MM-DD`: weeks that end on or after it; null for all. */
  from: string | null
}

export interface FilterSearch {
  type?: 'new' | 'fixed'
  version?: string
  from?: string
}

/** The URL query as filters; anything unknown is dropped. */
export function parseFilters(search: Record<string, unknown>): FilterSearch {
  const out: FilterSearch = {}
  if (search.type === 'new' || search.type === 'fixed') out.type = search.type
  if (typeof search.version === 'string' && SEMVER.test(search.version))
    out.version = search.version
  if (isDay(search.from)) out.from = search.from
  return out
}

export const toFilters = (s: FilterSearch): Filters => ({
  type: s.type ?? 'all',
  version: s.version ?? null,
  from: s.from ?? null,
})

export const toSearch = (f: Filters): FilterSearch => ({
  ...(f.type === 'all' ? {} : { type: f.type }),
  ...(f.version ? { version: f.version } : {}),
  ...(f.from ? { from: f.from } : {}),
})

/** The weeks that match, newest first, with only the items of that type. */
export function applyFilters(
  weeks: readonly WeekDigest[],
  f: Filters,
): WeekDigest[] {
  return [...weeks]
    .sort((a, b) => b.week.localeCompare(a.week))
    .filter((w) => f.version === null || w.version === f.version)
    .filter((w) => f.from === null || weekEnd(w.week) >= f.from)
    .map((w) => ({
      ...w,
      new: f.type === 'fixed' ? [] : w.new,
      fixed: f.type === 'new' ? [] : w.fixed,
    }))
    .filter((w) => w.new.length + w.fixed.length > 0)
}

/** The versions to pick from, newest first, with whether each is still coming. */
export function versionsOf(
  weeks: readonly WeekDigest[],
): { version: string; unreleased: boolean }[] {
  const seen = new Map<string, boolean>()
  for (const w of weeks) {
    if (!w.version) continue
    seen.set(w.version, (seen.get(w.version) ?? false) || w.unreleased)
  }
  return [...seen]
    .map(([version, unreleased]) => ({ version, unreleased }))
    .sort((a, b) => compareVersions(b.version, a.version))
}
