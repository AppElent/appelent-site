// The count keys each app's `convex/accountPortal.ts` sends (APP-482:
// workouts#306, gather#446, golf-app#111, games#131), and how the portal
// reads them.
import { describe, expect, it } from 'vitest'
import {
  type AppId,
  apps,
  countKeyForTable,
  countLabel,
  shownCounts,
} from '../src/portal/apps.ts'
import { countsLine } from '../src/screens/Overview.tsx'

const shipped: Record<AppId, string[]> = {
  gather: [
    'groups',
    'recipes',
    'meals',
    'plannedMeals',
    'taskLists',
    'tasks',
    'notes',
    'calendarEvents',
    'babyEvents',
    'tastings',
    'loyaltyCards',
    'houseRecords',
    'financeRecords',
    'energyRecords',
  ],
  foundry: [
    'workoutSessions',
    'routines',
    'sets',
    'oneRepMaxes',
    'bodyMetrics',
    'wodResults',
    'wods',
    'exercises',
    'activities',
    'enduranceActivityDetails',
    'nutritionDiaryEntries',
    'nutritionGoals',
    'nutritionGoalVersions',
    'nutritionGoalPreferences',
    'nutritionLibraryRecords',
    'nutritionCaptureDrafts',
    'personalMeasures',
    'supplementaryServings',
  ],
  fairway: [
    'rounds',
    'shots',
    'clubs',
    'courseCopies',
    'courseSuggestions',
    'settings',
  ],
  arcade: ['gameSeats', 'drafts', 'quizSets'],
}

describe('count-key catalog', () => {
  it.each(Object.entries(shipped))(
    'labels every key %s ships, in NL and EN',
    (app, keys) => {
      expect(Object.keys(apps[app as AppId].labels)).toEqual(keys)
      for (const key of keys) {
        const label = apps[app as AppId].labels[key]
        expect(label?.nl, key).toMatch(/\S/)
        expect(label?.en, key).toMatch(/\S/)
      }
    },
  )

  it('reads an unknown key as words', () => {
    expect(countLabel('arcade', 'sessionAnswers', 'nl')).toBe('Session answers')
    expect(countLabel('foundry', 'x', 'en')).toBe('X')
  })

  it('maps export tables onto their count keys', () => {
    expect(countKeyForTable('gather', 'groups/thuis/mealEntries')).toBe('meals')
    expect(countKeyForTable('gather', 'groups/thuis/recipes')).toBe('recipes')
    expect(countKeyForTable('gather', 'groups/thuis/loanParts')).toBe(
      'houseRecords',
    )
    expect(countKeyForTable('gather', 'groups/thuis/holdings')).toBe(
      'financeRecords',
    )
    expect(countKeyForTable('gather', 'groups/thuis/energyReadings')).toBe(
      'energyRecords',
    )
    expect(countKeyForTable('fairway', 'courses')).toBe('courseCopies')
    expect(countKeyForTable('fairway', 'userSettings')).toBe('settings')
    expect(countKeyForTable('arcade', 'sessionParticipants')).toBe('gameSeats')
    expect(countKeyForTable('foundry', 'workoutSessions')).toBe(
      'workoutSessions',
    )
  })

  it('leaves empty kinds out, but keeps a capped one', () => {
    expect(
      shownCounts([
        { key: 'a', count: 0, more: false },
        { key: 'b', count: 1000, more: true },
        { key: 'c', count: 2, more: false },
      ]).map((c) => c.key),
    ).toEqual(['b', 'c'])
    expect(
      countsLine(
        'foundry',
        [
          { key: 'workoutSessions', count: 0, more: false },
          { key: 'routines', count: 0, more: false },
          { key: 'nutritionDiaryEntries', count: 290, more: false },
          { key: 'bodyMetrics', count: 4, more: false },
        ],
        3,
        'nl',
      ),
    ).toBe('290 voedingsregels · 4 lichaamsmetingen')
  })
})
