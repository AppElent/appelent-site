import { describe, expect, it } from 'vitest'
import {
  ContractError,
  parseExportPage,
  parseSummary,
} from '../src/portal/contract.ts'

describe('parseSummary', () => {
  it('reads null as "never used"', () => {
    expect(parseSummary(null)).toBeNull()
  })

  it('accepts a contract 1 summary', () => {
    const summary = {
      contract: 1,
      lastActiveAt: 1_700_000_000_000,
      counts: [{ key: 'recipes', count: 148, more: false }],
    }
    expect(parseSummary(summary)).toEqual(summary)
  })

  it('accepts lastActiveAt null', () => {
    expect(
      parseSummary({ contract: 1, lastActiveAt: null, counts: [] })
        ?.lastActiveAt,
    ).toBeNull()
  })

  it.each([
    ['an unknown contract', { contract: 2, lastActiveAt: null, counts: [] }],
    ['a missing contract', { lastActiveAt: null, counts: [] }],
    ['a string date', { contract: 1, lastActiveAt: '2026-01-01', counts: [] }],
    ['a NaN date', { contract: 1, lastActiveAt: Number.NaN, counts: [] }],
    [
      'an infinite date',
      { contract: 1, lastActiveAt: Number.POSITIVE_INFINITY, counts: [] },
    ],
    ['a date out of range', { contract: 1, lastActiveAt: 1e20, counts: [] }],
    [
      'counts that are not a list',
      { contract: 1, lastActiveAt: null, counts: {} },
    ],
    [
      'a negative count',
      {
        contract: 1,
        lastActiveAt: null,
        counts: [{ key: 'a', count: -1, more: false }],
      },
    ],
    [
      'a count without more',
      { contract: 1, lastActiveAt: null, counts: [{ key: 'a', count: 1 }] },
    ],
    ['a list', []],
    ['a string', 'nope'],
  ])('rejects %s', (_, value) => {
    expect(() => parseSummary(value)).toThrow(ContractError)
  })
})

describe('parseExportPage', () => {
  const page = {
    contract: 1,
    app: 'gather',
    tables: { recipes: [{ _id: 'r1' }] },
    next: 'c1',
  }

  it('accepts a page for the asked app', () => {
    expect(parseExportPage(page, 'gather')).toEqual(page)
  })

  it('accepts the last page', () => {
    expect(parseExportPage({ ...page, next: null }, 'gather').next).toBeNull()
  })

  it.each([
    ['another app', { ...page, app: 'foundry' }],
    ['an unknown contract', { ...page, contract: 3 }],
    ['a numeric cursor', { ...page, next: 4 }],
    ['a table that is not a list', { ...page, tables: { recipes: {} } }],
    ['tables that are a list', { ...page, tables: [] }],
  ])('rejects %s', (_, value) => {
    expect(() => parseExportPage(value, 'gather')).toThrow(ContractError)
  })
})
