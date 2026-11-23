// The maintainer's tool for the portal's "Wat is er nieuw" tab (APP-628).
// The daily maintainer round runs it where developer-home's `changelog`
// branch is readable; the steps are in developer-home's control-room-releases
// README. From the repository root:
//
//   pnpm whats-new pending <changelog.json> [--since YYYY-MM-DD]
//       The user-facing rows no digest has handled yet, per app and ISO week,
//       as JSON. Default: from the Monday four weeks back.
//   pnpm whats-new shot <app> <week> <slug> <url-or-file>
//       Copies one screenshot into content/whats-new/<app>/img/, resized to
//       WebP under 150 KB, and prints the `screenshots[]` entry to paste.
//       Behind a proxy, set NODE_USE_ENV_PROXY=1 or pass a downloaded file.
//   pnpm whats-new sync <changelog.json>
//       Recomputes every week's stage, since, version and unreleased from the
//       rows in sources.json. Text is never touched.
//
// Each app folder holds `<yyyy>-W<ww>.json` (the digest the page shows) and
// `sources.json` (week → the changelog row ids it covers, shown or skipped;
// never bundled, so no PR number reaches the page).
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  compareVersions,
  isoWeek,
  MAX_SCREENSHOT_BYTES,
  type Stage,
  stages,
  weekStart,
} from '../src/whats-new/digest.ts'

// apps.ts imports the app icons, which plain Node cannot load.
export const appIds = ['gather', 'foundry', 'fairway', 'arcade'] as const

export const CONTENT = fileURLToPath(
  new URL('../../../content/whats-new/', import.meta.url),
)

interface StageEntry {
  at: string | null
}
export interface ChangelogRow {
  id: string
  app: string
  type: string
  title: string
  summary: string | null
  userFacing: boolean
  mergedAt: string
  screenshots: string[]
  version: string | null
  unreleased: boolean | null
  stages: {
    web: StageEntry | null
    preview: StageEntry | null
    production: StageEntry | null
    store: StageEntry | null
  }
}

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, 'utf8'))
const writeJson = (path: string, value: unknown) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)

export function readRows(path: string): ChangelogRow[] {
  const data = readJson(path) as { rows?: ChangelogRow[] }
  if (!Array.isArray(data.rows)) throw new Error(`${path}: no "rows"`)
  return data.rows
}

export const sourcesPath = (app: string) => join(CONTENT, app, 'sources.json')
export function readSources(app: string): Record<string, string[]> {
  const path = sourcesPath(app)
  return existsSync(path) ? (readJson(path) as Record<string, string[]>) : {}
}

/** The furthest stage a row reached: store, app update, or the web app. */
export function rowStage(row: ChangelogRow): Stage | null {
  if (row.stages.store) return 'store'
  if (row.stages.production) return 'app'
  if (row.stages.web) return 'web'
  return null
}
const stageEntry = (row: ChangelogRow, stage: Stage) =>
  row.stages[stage === 'app' ? 'production' : stage]

/** A week's release facts from its rows: what every change reached. */
export function weekFacts(rows: ChangelogRow[]) {
  let stage: Stage | null = rows.length ? 'store' : null
  for (const row of rows) {
    const reached = rowStage(row)
    if (
      reached === null ||
      (stage && stages.indexOf(reached) < stages.indexOf(stage))
    )
      stage = reached
    if (stage === null) break
  }
  const dates = stage
    ? rows
        .map((row) => stageEntry(row, stage)?.at)
        .filter((at): at is string => typeof at === 'string')
        .sort()
    : []
  const versions = rows
    .map((row) => row.version)
    .filter((v): v is string => typeof v === 'string')
    .sort(compareVersions)
  return {
    stage,
    since: dates.at(-1)?.slice(0, 10) ?? null,
    version: versions.at(-1) ?? null,
    unreleased: rows.some((row) => row.unreleased === true),
  }
}

export function pending(rows: ChangelogRow[], since: string) {
  const out: Record<string, Record<string, unknown[]>> = {}
  for (const app of appIds) {
    const handled = new Set(Object.values(readSources(app)).flat())
    for (const row of rows) {
      if (row.app !== app || !row.userFacing || handled.has(row.id)) continue
      if (row.mergedAt.slice(0, 10) < since) continue
      const week = isoWeek(row.mergedAt)
      out[app] ??= {}
      out[app][week] ??= []
      out[app][week].push({
        id: row.id,
        type: row.type,
        title: row.title,
        summary: row.summary,
        screenshots: row.screenshots,
        mergedAt: row.mergedAt,
      })
    }
  }
  return out
}

/** Rewrites the release facts of every week file; returns the files changed. */
export function sync(rows: ChangelogRow[]): string[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const changed: string[] = []
  for (const app of appIds) {
    const sources = readSources(app)
    for (const [week, ids] of Object.entries(sources)) {
      const path = join(CONTENT, app, `${week}.json`)
      if (!existsSync(path)) continue
      const facts = weekFacts(
        ids.map((id) => byId.get(id)).filter((r) => r !== undefined),
      )
      const digest = readJson(path) as Record<string, unknown>
      const next: Record<string, unknown> = { ...digest, ...facts }
      if (JSON.stringify(next) !== JSON.stringify(digest)) {
        writeJson(path, {
          week: next.week,
          stage: next.stage,
          since: next.since,
          version: next.version,
          unreleased: next.unreleased,
          new: next.new,
          fixed: next.fixed,
        })
        changed.push(`${app}/${week}.json`)
      }
    }
  }
  return changed
}

/** A full-page capture keeps its top, at most a tall phone screen's shape. */
const TALLEST = 2.17

/** Resized WebP under the size limit: smaller quality first, then smaller. */
export async function screenshot(input: Buffer) {
  const meta = await sharp(input).metadata()
  const tall =
    meta.width && meta.height && meta.height > meta.width * TALLEST
      ? {
          left: 0,
          top: 0,
          width: meta.width,
          height: Math.round(meta.width * TALLEST),
        }
      : null
  for (const [box, quality] of [
    [1400, 80],
    [1400, 70],
    [1200, 65],
    [1000, 60],
  ] as const) {
    const image = sharp(input)
    if (tall) image.extract(tall)
    const { data, info } = await image
      .resize({
        width: Math.round(box * 0.6),
        height: box,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true })
    if (data.length <= MAX_SCREENSHOT_BYTES)
      return { data, width: info.width, height: info.height }
  }
  throw new Error('Could not get the screenshot under 150 KB')
}

async function main(args: string[]) {
  const [command, ...rest] = args
  if (command === 'pending' && rest[0]) {
    const flag = rest.indexOf('--since')
    const fourWeeksBack = new Date(
      Date.parse(weekStart(isoWeek(Date.now()))) - 28 * 86_400_000,
    )
      .toISOString()
      .slice(0, 10)
    const since = flag >= 0 ? (rest[flag + 1] ?? '') : fourWeeksBack
    console.log(JSON.stringify(pending(readRows(rest[0]), since), null, 2))
    return
  }
  if (command === 'sync' && rest[0]) {
    const changed = sync(readRows(rest[0]))
    console.log(changed.length ? changed.join('\n') : 'Nothing changed.')
    return
  }
  if (command === 'shot' && rest.length === 4) {
    const [app = '', week = '', slug = '', source = ''] = rest
    if (!(appIds as readonly string[]).includes(app))
      throw new Error(`Unknown app: ${app}`)
    weekStart(week)
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug))
      throw new Error('slug: lower case letters, digits and dashes')
    const input = /^https?:\/\//.test(source)
      ? Buffer.from(
          await (async () => {
            const res = await fetch(source)
            if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`)
            return res.arrayBuffer()
          })(),
        )
      : readFileSync(source)
    const shot = await screenshot(input)
    const dir = join(CONTENT, app, 'img')
    mkdirSync(dir, { recursive: true })
    const file = `${week.toLowerCase()}-${slug}.webp`
    writeFileSync(join(dir, file), shot.data)
    console.log(
      JSON.stringify({
        file,
        width: shot.width,
        height: shot.height,
        alt: { nl: '', en: '' },
      }),
    )
    return
  }
  console.error(
    'Usage: pnpm whats-new pending <changelog.json> [--since YYYY-MM-DD]\n' +
      '       pnpm whats-new shot <app> <week> <slug> <url-or-file>\n' +
      '       pnpm whats-new sync <changelog.json>',
  )
  process.exit(2)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2))
}

/** For the content test: every image file of an app. */
export const imageFiles = (app: string) => {
  const dir = join(CONTENT, app, 'img')
  return existsSync(dir) ? readdirSync(dir) : []
}
