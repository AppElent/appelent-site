import { describe, expect, it } from 'vitest'
import {
  applyFilters,
  isoWeek,
  leaks,
  parseFilters,
  parseWeek,
  shortVersion,
  toFilters,
  toSearch,
  versionsOf,
  type WeekDigest,
  weekEnd,
  weekStart,
} from '../src/whats-new/digest.ts'

const week = (w: string, extra: Partial<WeekDigest> = {}): WeekDigest => ({
  week: w,
  stage: 'web',
  since: null,
  version: '1.1.0',
  unreleased: true,
  new: [
    {
      title: { nl: `Nieuw ${w}`, en: `New ${w}` },
      body: { nl: 'Tekst', en: 'Text' },
      screenshots: [],
    },
  ],
  fixed: [{ nl: `Opgelost ${w}`, en: `Fixed ${w}` }],
  ...extra,
})

describe('weeks', () => {
  it('finds Monday and Sunday of an ISO week', () => {
    expect(weekStart('2026-W47')).toBe('2026-11-16')
    expect(weekEnd('2026-W47')).toBe('2026-11-22')
    expect(weekStart('2026-W01')).toBe('2025-12-29')
    expect(weekStart('2020-W53')).toBe('2020-12-28')
  })

  it('puts a moment in its ISO week', () => {
    expect(isoWeek('2026-11-23T16:14:12Z')).toBe('2026-W48')
    expect(isoWeek('2026-11-22T23:59:59Z')).toBe('2026-W47')
    expect(isoWeek('2026-01-01T00:00:00Z')).toBe('2026-W01')
    expect(isoWeek('2021-01-03T12:00:00Z')).toBe('2020-W53')
  })

  it('shortens a minor version', () => {
    expect(shortVersion('1.1.0')).toBe('1.1')
    expect(shortVersion('1.1.2')).toBe('1.1.2')
  })
})

describe('filters', () => {
  const weeks = [
    week('2026-W45', { version: '1.0.0', unreleased: false }),
    week('2026-W47'),
    week('2026-W46', { fixed: [] }),
  ]

  it('keeps only known query values', () => {
    expect(
      parseFilters({ type: 'new', version: '1.1.0', from: '2026-11-01' }),
    ).toEqual({ type: 'new', version: '1.1.0', from: '2026-11-01' })
    expect(
      parseFilters({ type: 'bugs', version: '1.1', from: '2026-13-45' }),
    ).toEqual({})
    expect(toSearch(toFilters({}))).toEqual({})
  })

  it('shows newest first, all types by default', () => {
    expect(applyFilters(weeks, toFilters({})).map((w) => w.week)).toEqual([
      '2026-W47',
      '2026-W46',
      '2026-W45',
    ])
  })

  it('drops a week with nothing of the chosen type', () => {
    const fixed = applyFilters(weeks, toFilters({ type: 'fixed' }))
    expect(fixed.map((w) => w.week)).toEqual(['2026-W47', '2026-W45'])
    expect(fixed.every((w) => w.new.length === 0)).toBe(true)
  })

  it('combines version and from-date', () => {
    const f = toFilters({ version: '1.1.0', from: '2026-11-15' })
    // W46 ends on Sunday 15 November, so it still counts.
    expect(applyFilters(weeks, f).map((w) => w.week)).toEqual([
      '2026-W47',
      '2026-W46',
    ])
    expect(
      applyFilters(weeks, toFilters({ version: '1.0.0', from: '2026-11-16' })),
    ).toEqual([])
  })

  it('lists versions newest first, marking the coming one', () => {
    expect(versionsOf(weeks)).toEqual([
      { version: '1.1.0', unreleased: true },
      { version: '1.0.0', unreleased: false },
    ])
  })
})

describe('parseWeek', () => {
  it('accepts a valid week', () => {
    const { problems } = parseWeek(week('2026-W47'), '2026-W47')
    expect(problems).toEqual([])
  })

  it('lists every problem', () => {
    const { problems } = parseWeek(
      {
        week: '2026-W46',
        stage: 'preview',
        since: 'yesterday',
        version: '1.1',
        unreleased: 'no',
        new: [
          {
            title: { nl: 'Zie APP-12', en: '' },
            body: { nl: 'a', en: 'b' },
            screenshots: [{ file: 'Shot.PNG', width: 0, height: 2 }],
          },
        ],
        fixed: [],
      },
      '2026-W47',
    )
    expect(problems).toEqual(
      expect.arrayContaining([
        'week: must be "2026-W47"',
        'stage: web, app, store or null',
        'since: YYYY-MM-DD or null',
        'version: x.y.z or null',
        'unreleased: boolean',
        'new[0].title: needs non-empty "nl" and "en"',
        'new[0].screenshots[0].file: a .webp or .jpg name in img/',
        'new[0].screenshots[0].width: a positive integer',
        'new[0].screenshots[0].alt: needs non-empty "nl" and "en"',
      ]),
    )
  })

  it('refuses the same line twice in a week', () => {
    const w = week('2026-W47')
    const { problems } = parseWeek(
      { ...w, fixed: [...w.fixed, ...w.fixed] },
      '2026-W47',
    )
    expect(problems).toEqual(['"Fixed 2026-W47": appears twice in the week'])
  })

  it('refuses ids, links and addresses on the page', () => {
    expect(leaks('Fixed in APP-628')).toMatch(/issue id/)
    expect(leaks('See #149')).toMatch(/PR number/)
    expect(leaks('Go to https://github.com')).toMatch(/link/)
    expect(leaks('Mail sam@example.com')).toMatch(/email/)
    expect(leaks('Version 1.0.0 is out, 10.000 points')).toBeNull()
  })
})
