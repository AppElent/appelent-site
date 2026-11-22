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
  /** Labels per `counts[].key`; unknown keys fall back to a readable key. */
  labels: Record<string, Localized>
  /** "Over de download" note on the app page. */
  note: Localized
}

export const apps: Record<AppId, AppInfo> = {
  gather: {
    id: 'gather',
    name: 'Gather',
    kind: { nl: 'Huishouden', en: 'Household' },
    icon: gatherIcon,
    webUrl: 'https://gather.appelent.nl',
    labels: {
      groups: { nl: 'Groepen', en: 'Groups' },
      recipes: { nl: 'Recepten', en: 'Recipes' },
      mealPlans: { nl: 'Weekmenu’s', en: 'Meal plans' },
      lists: {
        nl: 'Boodschappen- en voorraadlijsten',
        en: 'Grocery and pantry lists',
      },
      tasks: { nl: 'Taken', en: 'Tasks' },
      notes: { nl: 'Notities', en: 'Notes' },
      events: { nl: 'Afspraken', en: 'Events' },
    },
    note: {
      nl: 'Je krijgt alles wat jij hebt gemaakt, als JSON. Wat anderen in je groepen zetten, blijft van hen en zit er niet in.',
      en: 'You get everything you created, as JSON. What others add to your groups stays theirs and is not included.',
    },
  },
  foundry: {
    id: 'foundry',
    name: 'Foundry',
    kind: { nl: 'Training', en: 'Training' },
    icon: foundryIcon,
    webUrl: 'https://foundry.appelent.nl',
    labels: {
      workouts: { nl: 'Trainingen', en: 'Workouts' },
      sets: { nl: 'Sets', en: 'Sets' },
      routines: { nl: 'Schema’s', en: 'Routines' },
      rides: { nl: 'Hardloop- en fietsritten', en: 'Runs and rides' },
      foodDays: {
        nl: 'Dagen in je voedingsdagboek',
        en: 'Days in your food diary',
      },
      bodyMetrics: { nl: 'Lichaamsmetingen', en: 'Body measurements' },
    },
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
      holeScores: { nl: 'Scores per hole', en: 'Hole scores' },
      courses: { nl: 'Eigen banen', en: 'Own courses' },
    },
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
      games: { nl: 'Gespeelde spellen', en: 'Games played' },
      scores: { nl: 'Scores', en: 'Scores' },
    },
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

/** The shared privacy policy's section for this app. */
export const privacyUrl = (app: AppId) =>
  `https://appelent.nl/privacy#app-${app}`
