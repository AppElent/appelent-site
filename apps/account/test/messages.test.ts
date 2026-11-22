import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatDay,
  formatList,
  formatSize,
  messages,
} from '../src/i18n/messages.ts'
import { countLabel } from '../src/portal/apps.ts'

describe('formatters', () => {
  it('groups counts like the design', () => {
    expect(formatCount(5402, false, 'nl')).toBe('5.402')
    expect(formatCount(5402, false, 'en')).toBe('5,402')
    expect(formatCount(1000, true, 'nl')).toBe('1.000+')
  })

  it('writes sizes in MB', () => {
    expect(formatSize(2_100_000, 'nl')).toBe('2,1 MB')
    expect(formatSize(2_100_000, 'en')).toBe('2.1 MB')
    expect(formatSize(10, 'en')).toBe('0.1 MB')
  })

  it('says today, yesterday, or the date', () => {
    const now = new Date(2026, 10, 22, 12).getTime()
    expect(formatDay(now - 60_000, 'nl', now)).toBe('vandaag')
    expect(formatDay(now - 86_400_000, 'en', now)).toBe('yesterday')
    expect(formatDay(new Date(2026, 10, 9).getTime(), 'nl', now)).toMatch(
      /^9 nov\.? 2026$/,
    )
  })

  it('joins lists in each language', () => {
    expect(formatList(['Gather'], 'nl')).toBe('Gather')
    expect(formatList(['Gather', 'Foundry', 'Fairway'], 'nl')).toBe(
      'Gather, Foundry en Fairway',
    )
    expect(formatList(['Gather', 'Foundry'], 'en')).toBe('Gather and Foundry')
  })

  it('has the same keys in both languages', () => {
    const keys = (value: object): string[] =>
      Object.entries(value).flatMap(([k, v]) =>
        typeof v === 'object' ? keys(v).map((s) => `${k}.${s}`) : [k],
      )
    expect(keys(messages.en)).toEqual(keys(messages.nl))
  })

  it('labels unknown count keys readably', () => {
    expect(countLabel('gather', 'recipes', 'nl')).toBe('Recepten')
    expect(countLabel('gather', 'shoppingItems', 'en')).toMatch(
      /shopping items/i,
    )
  })
})
