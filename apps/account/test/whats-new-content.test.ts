// @vitest-environment node
// The committed digests: what the maintainer round writes must parse, point
// at screenshots that exist and stay small, and keep its sources in step.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  appIds,
  type ChangelogRow,
  CONTENT,
  weekFacts,
} from '../scripts/whats-new.ts'
import { MAX_SCREENSHOT_BYTES, parseWeek } from '../src/whats-new/digest.ts'

const weekFiles = (app: string) =>
  readdirSync(join(CONTENT, app)).filter((f) => /^\d{4}-W\d{2}\.json$/.test(f))

describe.each(appIds)('content/whats-new/%s', (app) => {
  const dir = join(CONTENT, app)

  it('has at least the backfilled weeks', () => {
    expect(weekFiles(app).length).toBeGreaterThanOrEqual(3)
  })

  it('parses every week, and its screenshots exist under 150 KB', () => {
    const used = new Set<string>()
    for (const file of weekFiles(app)) {
      const week = file.replace('.json', '')
      const raw = JSON.parse(readFileSync(join(dir, file), 'utf8'))
      const { digest, problems } = parseWeek(raw, week)
      expect(problems, `${app}/${file}`).toEqual([])
      for (const shot of digest.new.flatMap((n) => n.screenshots)) {
        const path = join(dir, 'img', shot.file)
        expect(existsSync(path), path).toBe(true)
        expect(statSync(path).size).toBeLessThanOrEqual(MAX_SCREENSHOT_BYTES)
        used.add(shot.file)
      }
    }
    const images = existsSync(join(dir, 'img'))
      ? readdirSync(join(dir, 'img'))
      : []
    expect(
      images.filter((f) => !used.has(f)),
      'images no week uses',
    ).toEqual([])
  })

  it('records the sources of every week', () => {
    const sources = JSON.parse(
      readFileSync(join(dir, 'sources.json'), 'utf8'),
    ) as Record<string, string[]>
    expect(Object.keys(sources).sort()).toEqual(
      weekFiles(app)
        .map((f) => f.replace('.json', ''))
        .sort(),
    )
  })
})

describe('weekFacts', () => {
  const row = (stages: Partial<ChangelogRow['stages']>, extra = {}) =>
    ({
      id: 'x#1',
      app: 'gather',
      type: 'new',
      title: 't',
      summary: null,
      userFacing: true,
      mergedAt: '2026-11-20T10:00:00Z',
      screenshots: [],
      version: '1.1.0',
      unreleased: true,
      stages: {
        web: null,
        preview: null,
        production: null,
        store: null,
        ...stages,
      },
      ...extra,
    }) as ChangelogRow

  it('takes the stage every change reached, and its latest date', () => {
    expect(
      weekFacts([
        row({
          web: { at: '2026-11-20T10:00:00Z' },
          production: { at: '2026-11-22T06:00:00Z' },
        }),
        row({ web: { at: '2026-11-21T09:00:00Z' } }),
      ]),
    ).toEqual({
      stage: 'web',
      since: '2026-11-21',
      version: '1.1.0',
      unreleased: true,
    })
  })

  it('is not out while one change is not', () => {
    expect(weekFacts([row({ web: { at: null } }), row({})]).stage).toBeNull()
  })

  it('reads the store once every change is in it', () => {
    expect(
      weekFacts([
        row(
          { store: { at: '2026-12-01T00:00:00Z' } },
          { unreleased: false, version: '1.1.0' },
        ),
      ]),
    ).toEqual({
      stage: 'store',
      since: '2026-12-01',
      version: '1.1.0',
      unreleased: false,
    })
  })
})
