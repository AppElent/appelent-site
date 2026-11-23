// The four apps, in the fixed display order of the design, with the labels the
// portal owns for each app's `summary.counts` keys (account-portal standard:
// "the portal owns the labels per app and locale").
import arcadeIcon from '../../../www/assets/apps/arcade.png'
import fairwayIcon from '../../../www/assets/apps/fairway.png'
import foundryIcon from '../../../www/assets/apps/foundry.png'
import gatherIcon from '../../../www/assets/apps/gather.png'
import type { Locale } from '../i18n/core.ts'

export const appIds = ['gather', 'foundry', 'fairway', 'arcade'] as const
export type AppId = (typeof appIds)[number]

export const isAppId = (value: string): value is AppId =>
  (appIds as readonly string[]).includes(value)

type Localized = Record<Locale, string>

export interface AppInfo {
  id: AppId
  name: string
  kind: Localized
  icon: string
  /** The app's own web app, for "Open <App>". */
  webUrl: string
  /**
   * Labels per `counts[].key`, as each app's `convex/accountPortal.ts` sends
   * them (APP-482); an unknown key falls back to readable words.
   */
  labels: Record<string, Localized>
  /** Export table names whose count key differs (`courses` → `courseCopies`). */
  tableKeys: Record<string, string>
  /** "Over de download" note on the app page. */
  note: Localized
  /**
   * Whether the app has an MCP server that Claude and other clients connect
   * to through Clerk OAuth. Such an app page explains where to manage that
   * connection (APP-632); the portal cannot list or revoke it.
   */
  connectedApps?: true
}

/** `tableKeys` entries for several tables that count under one key. */
const keyFor = (key: string, tables: string[]): Record<string, string> =>
  Object.fromEntries(tables.map((table) => [table, key]))

export const apps: Record<AppId, AppInfo> = {
  gather: {
    id: 'gather',
    connectedApps: true,
    name: 'Gather',
    kind: { nl: 'Huishouden', en: 'Household' },
    icon: gatherIcon,
    webUrl: 'https://gather.appelent.nl',
    labels: {
      groups: { nl: 'Groepen', en: 'Groups' },
      recipes: { nl: 'Recepten', en: 'Recipes' },
      meals: { nl: 'Maaltijden', en: 'Meals' },
      plannedMeals: { nl: 'Geplande maaltijden', en: 'Planned meals' },
      taskLists: { nl: 'Takenlijsten', en: 'Task lists' },
      tasks: { nl: 'Taken', en: 'Tasks' },
      notes: { nl: 'Notities', en: 'Notes' },
      calendarEvents: { nl: 'Afspraken', en: 'Calendar events' },
      babyEvents: { nl: 'Babylogregels', en: 'Baby log entries' },
      tastings: { nl: 'Proefnotities', en: 'Tastings' },
      loyaltyCards: { nl: 'Klantenkaarten', en: 'Loyalty cards' },
      houseRecords: { nl: 'Huisgegevens', en: 'Home records' },
      financeRecords: { nl: 'Financiële gegevens', en: 'Finance records' },
      energyRecords: { nl: 'Energiegegevens', en: 'Energy records' },
    },
    tableKeys: {
      mealEntries: 'meals',
      plannedDinners: 'plannedMeals',
      // House, Finance and Energy each count as one kind over their tables
      // (APP-601).
      ...keyFor('houseRecords', [
        'houses',
        'mortgageCalculations',
        'loanParts',
        'homeBuyingCosts',
      ]),
      ...keyFor('financeRecords', [
        'recurringCosts',
        'savingsGoals',
        'splitScenarios',
        'holdings',
        'holdingTransactions',
        'financeSettings',
        'netWorthEntries',
        'netWorthSnapshots',
      ]),
      ...keyFor('energyRecords', [
        'energySites',
        'energyContracts',
        'energySources',
        'energyAssets',
        'energyChannels',
        'energyReadings',
        'energyIntervals',
        'energyPriceFeeds',
      ]),
    },
    note: {
      nl: 'Je krijgt alles wat jij hebt gemaakt, als JSON. Wat anderen in je groepen zetten, blijft van hen en zit er niet in.',
      en: 'You get everything you created, as JSON. What others add to your groups stays theirs and is not included.',
    },
  },
  foundry: {
    id: 'foundry',
    connectedApps: true,
    name: 'Foundry',
    kind: { nl: 'Training', en: 'Training' },
    icon: foundryIcon,
    webUrl: 'https://foundry.appelent.nl',
    labels: {
      workoutSessions: { nl: 'Trainingen', en: 'Workouts' },
      routines: { nl: 'Schema’s', en: 'Routines' },
      sets: { nl: 'Sets', en: 'Sets' },
      oneRepMaxes: { nl: '1RM-records', en: 'One-rep maxes' },
      bodyMetrics: { nl: 'Lichaamsmetingen', en: 'Body measurements' },
      wodResults: { nl: 'WOD-resultaten', en: 'WOD results' },
      wods: { nl: 'WOD’s', en: 'WODs' },
      exercises: { nl: 'Eigen oefeningen', en: 'Own exercises' },
      activities: { nl: 'Activiteiten', en: 'Activities' },
      enduranceActivityDetails: {
        nl: 'Loop- en fietsgegevens',
        en: 'Run and ride details',
      },
      nutritionDiaryEntries: { nl: 'Voedingsregels', en: 'Food diary entries' },
      nutritionGoals: { nl: 'Voedingsdoelen', en: 'Nutrition goals' },
      nutritionGoalVersions: {
        nl: 'Eerdere voedingsdoelen',
        en: 'Earlier nutrition goals',
      },
      nutritionGoalPreferences: {
        nl: 'Voedingsvoorkeuren',
        en: 'Nutrition preferences',
      },
      nutritionLibraryRecords: {
        nl: 'Eigen voedingsmiddelen',
        en: 'Own foods',
      },
      nutritionCaptureDrafts: { nl: 'Voedingsconcepten', en: 'Food drafts' },
      personalMeasures: { nl: 'Eigen maten', en: 'Own measures' },
      supplementaryServings: { nl: 'Extra porties', en: 'Extra servings' },
    },
    tableKeys: {},
    note: {
      nl: 'Je krijgt al je trainingen, ritten, voeding en metingen als JSON. Foto’s zitten erin als links die 24 uur werken.',
      en: 'You get all your workouts, rides, food and measurements as JSON. Photos are included as links that work for 24 hours.',
    },
  },
  fairway: {
    id: 'fairway',
    name: 'Fairway',
    kind: { nl: 'Golf', en: 'Golf' },
    icon: fairwayIcon,
    webUrl: 'https://fairway.appelent.nl',
    labels: {
      rounds: { nl: 'Rondes', en: 'Rounds' },
      shots: { nl: 'Slagen', en: 'Shots' },
      clubs: { nl: 'Clubs', en: 'Clubs' },
      courseCopies: { nl: 'Eigen banen', en: 'Own courses' },
      courseSuggestions: { nl: 'Baansuggesties', en: 'Course suggestions' },
      settings: { nl: 'Instellingen', en: 'Settings' },
    },
    tableKeys: { courses: 'courseCopies', userSettings: 'settings' },
    note: {
      nl: 'Je krijgt je rondes, scores en eigen banen als JSON. Banen uit OpenStreetMap zitten erin als verwijzing.',
      en: 'You get your rounds, scores and own courses as JSON. Courses from OpenStreetMap are included as references.',
    },
  },
  arcade: {
    id: 'arcade',
    name: 'Arcade Club',
    kind: { nl: 'Spellen', en: 'Games' },
    icon: arcadeIcon,
    webUrl: 'https://arcade-club.appelent.nl',
    labels: {
      gameSeats: { nl: 'Deelnames', en: 'Seats taken' },
      drafts: { nl: 'Concepten', en: 'Drafts' },
      quizSets: { nl: 'Quizsets', en: 'Quiz sets' },
    },
    tableKeys: { sessionParticipants: 'gameSeats', contentDrafts: 'drafts' },
    note: {
      nl: 'Je krijgt je spellen en scores als JSON.',
      en: 'You get your games and scores as JSON.',
    },
  },
}

/** Label for a count key; an unknown key reads as words ("holeScores" → "Hole scores"). */
export function countLabel(app: AppId, key: string, locale: Locale): string {
  const known = apps[app].labels[key]
  if (known) return known[locale]
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The count key for an export table: Gather's group tables arrive as
 * `groups/<slug>/<table>`, and some tables count under another key.
 */
export function countKeyForTable(app: AppId, table: string): string {
  const name = table.slice(table.lastIndexOf('/') + 1)
  return apps[app].tableKeys[name] ?? name
}

/**
 * The counts worth a line: apps send every kind they keep, in their order,
 * zeros included (Foundry sends 18), so an empty kind is left out.
 */
export function shownCounts<T extends { count: number; more: boolean }>(
  counts: readonly T[],
): T[] {
  return counts.filter((c) => c.count > 0 || c.more)
}

/** The shared privacy policy's section for this app. */
export const privacyUrl = (app: AppId) =>
  `https://appelent.nl/privacy#app-${app}`
