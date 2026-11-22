// The portal's copy, word for word from designs/portal/portal_final/Main.dc.html
// (`T`), with the app-specific strings as functions of the app name.
import type { Locale } from './core.ts'

const nl = {
  meta: { title: 'AppElent-account' },
  shell: {
    homeLabel: 'AppElent account, overzicht',
    account: 'Account',
    navLabel: 'Accountmenu',
    langLabel: 'Taal',
    menuLabel: 'Accountmenu: uitloggen',
    tabs: { home: 'Overzicht', export: 'Downloaden', profile: 'Profiel' },
    signOut: 'Uitloggen',
    privacy: 'Privacy',
    support: 'Support',
  },
  signIn: {
    title: 'Je AppElent-account',
    lead: 'Eén account voor Gather, Foundry, Fairway en Arcade Club. Zie welke apps je gebruikt, download je gegevens en beheer hoe je inlogt.',
    card: 'Inloggen',
    cardSub: 'Gebruik hetzelfde account als in de apps.',
    note: 'Nog geen account? Dat maak je in een van de apps.',
  },
  home: {
    hello: (name: string | null) => (name ? `Hoi ${name}` : 'Hoi'),
    yourApps: 'Je apps',
    used: (n: number) =>
      n === 0 ? 'Nog geen app gebruikt' : `${n} van 4 in gebruik`,
    newUserNote:
      'Je hebt nog geen van de apps gebruikt. Open er een; je logt in met dit account.',
    notUsed: 'Nog niet gebruikt',
    inUse: 'In gebruik',
    unreachable: 'Niet bereikbaar',
    lastActive: (when: string) => `Laatst actief ${when}`,
    nothingStored: 'Er staat niets van je opgeslagen.',
    unreachableLine: 'Nu niet bereikbaar. Je andere apps werken gewoon.',
    loading: 'Je apps laden…',
    exportCardTitle: 'Al je gegevens downloaden',
    exportCardBody: 'Eén zip met een JSON-bestand per app.',
    exportCardCta: 'Naar downloaden',
    profileCardTitle: 'Profiel en inloggen',
    profileCardBody:
      'Naam, e-mailadres, wachtwoord, passkeys en je apparaten. Geldt voor alle apps.',
    profileCardCta: 'Profiel openen',
    deleteCardTitle: 'Account verwijderen',
    deleteCardBody:
      'Dat kan nu in elke app onder Instellingen › Account. Binnenkort ook hier, voor één app of alles tegelijk.',
  },
  app: {
    back: 'Overzicht',
    statusUsed: (when: string | null) =>
      when ? `In gebruik · laatst actief ${when}` : 'In gebruik',
    download: (app: string) => `Download ${app}-gegevens`,
    downloading: 'Bezig met maken…',
    downloadFailed: (app: string) =>
      `${app} lukte niet. Probeer het zo opnieuw.`,
    open: (app: string) => `Open ${app}`,
    dataTitle: (app: string) => `Wat ${app} van je bewaart`,
    aboutDownload: 'Over de download',
    privacy: (app: string) => `Privacybeleid van ${app}`,
    emptyTitle: (app: string) => `Je hebt ${app} nog niet gebruikt`,
    emptyBody: (app: string) =>
      `Er staat niets van je opgeslagen. Open ${app} om te beginnen; je logt in met dit account.`,
    errorTitle: (app: string) => `${app} is nu niet bereikbaar`,
    errorBody:
      'We konden deze app nu niet bereiken. Je gegevens zijn veilig; probeer het zo opnieuw.',
    retry: 'Opnieuw proberen',
    newTab: '(opent in een nieuw tabblad)',
  },
  export: {
    title: 'Je gegevens downloaden',
    lead: 'Eén zip met een JSON-bestand per app. Je browser haalt alles op en maakt de zip; je gegevens gaan nergens anders heen.',
    list: 'Wat erin komt',
    kinds: (n: number) =>
      n === 1 ? '1 soort gegevens' : `${n} soorten gegevens`,
    nothing: 'Niets te downloaden',
    unreachable: 'Niet bereikbaar',
    checking: 'Bezig met ophalen…',
    makeZip: 'Zip maken',
    zipHint: 'Duurt meestal minder dan een minuut.',
    making: 'Bezig met maken…',
    cancel: 'Annuleren',
    waiting: 'Wacht',
    done: (size: string) => `Klaar · ${size}`,
    working: (table: string, done: string, total: string | null) =>
      total
        ? `Bezig · ${table} ${done} van ${total}`
        : `Bezig · ${table} ${done}`,
    starting: 'Bezig',
    failed: 'Niet gelukt',
    retry: 'Opnieuw proberen',
    zipReady: (file: string, size: string) =>
      `Klaar: ${file} (${size}) staat in je downloads.`,
    downloadAgain: 'Opnieuw downloaden',
    makeNew: 'Nieuwe zip maken',
    partial: (app: string) => `${app} lukte niet. De rest is klaar.`,
    partialMany: (list: string) => `${list} lukten niet. De rest is klaar.`,
    retryApp: (app: string) => `${app} opnieuw proberen`,
    without: (app: string) => `Downloaden zonder ${app}`,
    withoutMany: 'Downloaden zonder deze apps',
    cancelled: 'Geannuleerd. Er is niets gedownload.',
    fileName: (date: string) => `appelent-gegevens-${date}.zip`,
    and: 'en',
  },
  profile: {
    title: 'Profiel',
    lead: 'Dit profiel geldt voor alle AppElent-apps. Wat je hier wijzigt, zie je overal.',
  },
  notFound: {
    title: 'Deze pagina bestaat niet',
    body: 'De link klopt niet of de pagina is verplaatst.',
    cta: 'Naar het overzicht',
  },
  dates: { today: 'vandaag', yesterday: 'gisteren' },
}

export type Messages = typeof nl

const en: Messages = {
  meta: { title: 'AppElent account' },
  shell: {
    homeLabel: 'AppElent account, overview',
    account: 'Account',
    navLabel: 'Account menu',
    langLabel: 'Language',
    menuLabel: 'Account menu: sign out',
    tabs: { home: 'Overview', export: 'Download', profile: 'Profile' },
    signOut: 'Sign out',
    privacy: 'Privacy',
    support: 'Support',
  },
  signIn: {
    title: 'Your AppElent account',
    lead: 'One account for Gather, Foundry, Fairway and Arcade Club. See which apps you use, download your data and manage how you sign in.',
    card: 'Sign in',
    cardSub: 'Use the same account as in the apps.',
    note: 'No account yet? You create one in any of the apps.',
  },
  home: {
    hello: (name) => (name ? `Hi ${name}` : 'Hi'),
    yourApps: 'Your apps',
    used: (n) => (n === 0 ? 'No app used yet' : `${n} of 4 in use`),
    newUserNote:
      'You have not used any of the apps yet. Open one; you sign in with this account.',
    notUsed: 'Not used yet',
    inUse: 'In use',
    unreachable: 'Unreachable',
    lastActive: (when) => `Last active ${when}`,
    nothingStored: 'Nothing of yours is stored.',
    unreachableLine: 'Unreachable right now. Your other apps work as usual.',
    loading: 'Loading your apps…',
    exportCardTitle: 'Download all your data',
    exportCardBody: 'One zip with a JSON file per app.',
    exportCardCta: 'Go to download',
    profileCardTitle: 'Profile and sign-in',
    profileCardBody:
      'Name, email, password, passkeys and your devices. Applies to every app.',
    profileCardCta: 'Open profile',
    deleteCardTitle: 'Delete account',
    deleteCardBody:
      'You can do this in each app under Settings › Account. Soon also here, for one app or everything at once.',
  },
  app: {
    back: 'Overview',
    statusUsed: (when) => (when ? `In use · last active ${when}` : 'In use'),
    download: (app) => `Download ${app} data`,
    downloading: 'Building…',
    downloadFailed: (app) => `${app} did not work. Try again in a moment.`,
    open: (app) => `Open ${app}`,
    dataTitle: (app) => `What ${app} keeps about you`,
    aboutDownload: 'About the download',
    privacy: (app) => `${app} privacy policy`,
    emptyTitle: (app) => `You have not used ${app} yet`,
    emptyBody: (app) =>
      `Nothing of yours is stored. Open ${app} to start; you sign in with this account.`,
    errorTitle: (app) => `${app} is unreachable right now`,
    errorBody:
      'We could not reach this app right now. Your data is safe; try again in a moment.',
    retry: 'Try again',
    newTab: '(opens in a new tab)',
  },
  export: {
    title: 'Download your data',
    lead: 'One zip with a JSON file per app. Your browser fetches everything and builds the zip; your data goes nowhere else.',
    list: 'What goes in',
    kinds: (n) => (n === 1 ? '1 kind of data' : `${n} kinds of data`),
    nothing: 'Nothing to download',
    unreachable: 'Unreachable',
    checking: 'Fetching…',
    makeZip: 'Build zip',
    zipHint: 'Usually takes less than a minute.',
    making: 'Building…',
    cancel: 'Cancel',
    waiting: 'Waiting',
    done: (size) => `Done · ${size}`,
    working: (table, done, total) =>
      total
        ? `Working · ${table} ${done} of ${total}`
        : `Working · ${table} ${done}`,
    starting: 'Working',
    failed: 'Did not work',
    retry: 'Try again',
    zipReady: (file, size) => `Done: ${file} (${size}) is in your downloads.`,
    downloadAgain: 'Download again',
    makeNew: 'Build a new zip',
    partial: (app) => `${app} did not work. The rest is ready.`,
    partialMany: (list) => `${list} did not work. The rest is ready.`,
    retryApp: (app) => `Try ${app} again`,
    without: (app) => `Download without ${app}`,
    withoutMany: 'Download without these apps',
    cancelled: 'Cancelled. Nothing was downloaded.',
    fileName: (date) => `appelent-data-${date}.zip`,
    and: 'and',
  },
  profile: {
    title: 'Profile',
    lead: 'This profile applies to every AppElent app. What you change here, you see everywhere.',
  },
  notFound: {
    title: 'This page does not exist',
    body: 'The link is wrong or the page has moved.',
    cta: 'Go to the overview',
  },
  dates: { today: 'today', yesterday: 'yesterday' },
}

export const messages: Record<Locale, Messages> = { nl, en }

const numberLocale: Record<Locale, string> = { nl: 'nl-NL', en: 'en-GB' }

/** "5.402" / "5,402"; a capped count reads "1.000+". */
export function formatCount(count: number, more: boolean, locale: Locale) {
  // `always`: nl-NL would otherwise leave 5402 ungrouped; the design shows 5.402.
  const grouped = new Intl.NumberFormat(numberLocale[locale], {
    useGrouping: 'always',
  }).format(count)
  return more ? `${grouped}+` : grouped
}

/** "2,1 MB" / "2.1 MB". */
export function formatSize(bytes: number, locale: Locale) {
  const mb = Math.max(bytes / 1_000_000, 0.1)
  return `${new Intl.NumberFormat(numberLocale[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(mb)} MB`
}

/** "vandaag", "gisteren", else "9 nov 2026" / "9 Nov 2026". */
export function formatDay(epochMs: number, locale: Locale, now = Date.now()) {
  const day = (ms: number) => {
    const d = new Date(ms)
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const diff = Math.round((day(now) - day(epochMs)) / 86_400_000)
  if (diff === 0) return messages[locale].dates.today
  if (diff === 1) return messages[locale].dates.yesterday
  return new Intl.DateTimeFormat(numberLocale[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(epochMs))
}

/** "Gather, Foundry en Fairway". */
export function formatList(items: string[], locale: Locale) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${messages[locale].export.and} ${items.at(-1)}`
}
