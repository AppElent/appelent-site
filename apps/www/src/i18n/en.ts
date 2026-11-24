import type { AppId } from '../content/apps.ts'
import type { Locale } from './core.ts'

// The English catalog. Every user-visible string on the site lives here or in
// nl.ts (i18n standard): no copy in templates, no locale ternaries. Section
// bodies are keyed records so the parity test compares every paragraph.

/** One block of the privacy policy, rendered as paragraphs, then a list, then paragraphs. */
export interface PolicySection {
  anchor: string
  title: string
  body: Record<string, string>
  items?: Record<string, string>
  outro?: Record<string, string>
}

export interface AppCopy {
  kind: string
  body: string
  /** Privacy section 3: what the app keeps. */
  stores: string
  /** Privacy section 3: what is specific to this app. */
  notes: Record<string, string>
}

export const en = {
  meta: {
    siteName: 'AppElent',
    homeTitle: 'AppElent · Apps for home, sport and play',
    homeDescription:
      'AppElent makes apps for home, sport and play: Gather, Foundry, Fairway and Arcade Club.',
    privacyTitle: 'Privacy policy · AppElent',
    privacyDescription:
      'One privacy policy for Gather, Foundry, Fairway, Arcade Club and appelent.nl.',
    supportTitle: 'Support · AppElent',
    supportDescription:
      'Help with Gather, Foundry, Fairway and Arcade Club: email us or read the answers to common questions.',
    notFoundTitle: 'Page not found · AppElent',
    ogLocale: 'en_US',
  },
  shell: {
    skip: 'Skip to content',
    homeLabel: 'AppElent, home page',
    navLabel: 'Main menu',
    navApps: 'Apps',
    navPrivacy: 'Privacy',
    navSupport: 'Support',
    langLabel: 'Language',
    languages: { nl: 'NL', en: 'EN' } satisfies Record<Locale, string>,
    languageNames: {
      nl: 'Nederlands',
      en: 'English',
    } satisfies Record<Locale, string>,
    footTag: 'Apps for home, sport and play.',
    footApps: 'Apps',
    footAppElent: 'AppElent',
    footContact: 'Contact',
    footAccount: 'Account',
    footStatus: 'Status',
    copyright: '© 2026 AppElent',
  },
  home: {
    hero: {
      eyebrow: 'AppElent',
      title: 'Apps for home, sport and play.',
      body: 'Four apps for the household, the gym, the golf course and game nights. On the web and on iPhone, with one account.',
      cta: 'See the apps',
      contact: 'Get in touch',
    },
    apps: {
      title: 'The apps',
      body: 'Four apps, each for one part of life. You sign in to all of them with the same account.',
      storeAlt: 'Download {app} on the App Store',
      soonSmall: 'App Store',
      soon: 'Coming soon',
      openWeb: 'Open web app',
    },
    account: {
      title: 'One account for every app',
      body: 'See which apps you use, download your data or delete your account, all in one place.',
      cta: 'Go to your account',
    },
    stack: {
      title: 'What we build with',
      body: 'Web and iPhone from one codebase per app, built with AI agents.',
    },
    contact: {
      title: 'Contact',
      body: 'A question or an idea? Email us or find us on GitHub.',
      mail: 'Email us',
      github: 'GitHub',
    },
  },
  apps: {
    gather: {
      kind: 'Household',
      body: 'Run the household together: recipes, meal plan, groceries and tasks, shared with the people you live with.',
      stores:
        'Groups and their Members, recipes (also ones you import from a web address), meal plans, grocery and pantry lists, tasks, notes, calendars and events, a baby log, household finances, tastings and photos.',
      notes: {
        group:
          'What you add to a Group is visible to every Member of that Group. Members see each other’s names, not email addresses. Photos open from a long, unguessable link that needs no sign-in.',
        health:
          'The baby log holds health data about a child. We process it based on explicit consent, given by entering it; only a parent or guardian should enter it. Delete it to withdraw consent.',
        integrations:
          'If a Member connects Notion or Todoist, we store an access token for that service so Gather can read and update the connected list. When you import a recipe, our server fetches the page; the website sees our server, not you.',
      },
    },
    foundry: {
      kind: 'Training',
      body: 'Track strength training and nutrition: sessions, routines, 1RM, runs and rides.',
      stores:
        'Workouts and sets, routines, WODs, 1RM and personal records, runs and rides, food diary, nutrition goals, body measurements and photos.',
      notes: {
        health:
          'Nutrition and body data can be health data. We process it based on explicit consent, given by logging it; delete it to withdraw consent.',
        shared:
          'In a shared workout, your display name and results are visible to the host and the other participants.',
      },
    },
    fairway: {
      kind: 'Golf',
      body: 'Your golf round on the course: scores per hole, statistics and your own courses.',
      stores:
        'Rounds with scores per hole, putts, fairways and greens, your handicap index, home course and clubs, courses you edit, guest players you add and course corrections you send.',
      notes: {
        location:
          'When you mark a shot, its GPS position is saved with that round to work out your club distances. Other distances are calculated on your phone; your location is not stored or sent to us. With GPS while locked, Fairway receives your location in the background only while a round is open on the Play screen.',
      },
    },
    arcade: {
      kind: 'Games',
      body: 'Games with friends, at the table or apart: quizzes, card and dice games, and chess.',
      stores:
        'Your display name, the rooms and games you host or join, and your moves and scores.',
      notes: {
        guests:
          'Guests play without an account, with a random identifier created on their device and the name they enter. Solo games, saved puzzles and settings stay on your device.',
        history:
          'Finished games stay so other players keep their history; when you delete your account, your name is removed from them.',
        camera:
          'The iOS app uses the camera only to scan an invite QR code. Images are processed on your device and never stored or uploaded.',
      },
    },
  } satisfies Record<AppId, AppCopy>,
  privacy: {
    title: 'Privacy policy',
    lead: 'One privacy policy for every app: what data we keep, why, and how you view or delete it.',
    scope: 'Gather · Foundry · Fairway · Arcade Club · appelent.nl',
    updated: 'Draft of 21 November 2026',
    tocLabel: 'Contents',
    draftNote:
      'Draft. This text merges the four current app policies and waits for Eric’s approval before it replaces them.',
    sections: {
      who: {
        anchor: 'who',
        title: 'Who we are',
        body: {
          who: 'AppElent is the name under which Eric Jansen makes apps. AppElent is responsible for the personal data described here. This policy covers Gather, Foundry, Fairway, Arcade Club and this website, appelent.nl.',
          contact: 'Questions about this policy or your data: email {email}.',
        },
      },
      account: {
        anchor: 'account',
        title: 'Your account',
        body: {
          shared:
            'All apps share one sign-in. For that we keep your name, your email address, a profile photo if you add one, and how you sign in: a password (stored hashed by our sign-in provider) or Apple, Google or Microsoft, which then share your name and email address with us.',
          purpose:
            'We use your account to sign you in and to keep what you store in each app. That is necessary to provide the apps to you.',
        },
      },
      perApp: {
        anchor: 'per-app',
        title: 'What each app keeps',
        body: {
          intro:
            'Each app keeps only what you put in it, to show it to you and sync it across your devices. Per app:',
        },
        outro: {
          site: 'This website keeps no account data. It sets one cookie, lang, to remember your language for a year. Cloudflare, which hosts the site, processes your IP address to deliver and protect it.',
          device:
            'Preferences such as language and appearance, and caches, stay on your device.',
        },
      },
      services: {
        anchor: 'services',
        title: 'Services we use',
        body: {
          intro:
            'These providers process data on our behalf, only to run the apps:',
        },
        items: {
          clerk: 'Clerk: sign-in and account management (USA).',
          convex:
            'Convex: database and file storage, hosted in the EU (Ireland).',
          cloudflare: 'Cloudflare: hosting of the websites and web apps.',
          sentry:
            'Sentry: crash and error reports (USA). A report holds technical details such as the error, the page, the device and the app version, never your email address, your name or what you enter. Reports from a website can carry your account’s internal ID. Foundry’s phone app records a small sample of sessions with all text and images masked.',
          expo: 'Expo: building the phone apps and delivering their updates.',
          anthropic:
            'Anthropic: AI help, only when you ask for it. Gather sends the text of a recipe page it cannot read, or a recipe’s ingredients to estimate its nutrition; Foundry sends your meal text or photos to recognise foods. Nothing is sent with your name or email address, and Anthropic does not use it to train models.',
          github:
            'GitHub: problem reports from Gather’s web app become issues in its public code repository. Do not put personal details in a report.',
          googleFonts:
            'Google Fonts: Gather’s web app loads its fonts from Google, which receives your IP address when a page loads.',
        },
        outro: {
          others:
            'Some features contact another service under its own privacy policy: Apple Maps for Fairway’s hole maps, Open Food Facts when you scan or search a food in Foundry, Spotify when Arcade Club’s Music Timeline opens a song search, and Notion or Todoist when a Gather Member connects them. Course layouts come from OpenStreetMap; nothing about you is sent there.',
          transfers:
            'Transfers outside the European Economic Area rely on appropriate safeguards, such as the EU–US Data Privacy Framework or the European Commission’s Standard Contractual Clauses.',
          noAds:
            'We do not sell your data, show advertising, use your data for marketing or profiling, or track you across other apps and websites.',
        },
      },
      rights: {
        anchor: 'rights',
        title: 'View and delete',
        body: {
          delete:
            'In each app, under Account, you choose to delete only that app’s data or your whole AppElent account, which removes your sign-in and your data in every app. Soon you can also do this at account.appelent.nl. Deleting in an app takes effect right away; a request by email is handled within 30 days.',
          groups:
            'In Gather, Groups where you are the only Member are deleted with everything in them. What you added to a Group you share stays with that Group, because it belongs to the household.',
          retention:
            'We keep your data for as long as you have an account. Error and problem reports are deleted within 90 days; a report filed on GitHub stays until it is removed, and we remove yours on request.',
          rights:
            'You have the right to access, correct, delete or export your data, to restrict or object to its processing, and to withdraw consent. Gather and Foundry let you export your data yourself. For any other request, email {email}; we respond within one month.',
          complaint:
            'You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens) or the data protection authority in your country.',
          security:
            'Data travels over encrypted connections, and only you, or the Members of your Group, can reach it after signing in.',
          children: 'The apps are not intended for children under 16.',
        },
      },
      contact: {
        anchor: 'contact',
        title: 'Contact',
        body: {
          email:
            'Questions about your data? Email {email}. If we change this policy, we update the date at the top.',
        },
      },
    } satisfies Record<string, PolicySection>,
  },
  support: {
    title: 'Support',
    lead: 'Stuck on something, or have an idea? Let us know.',
    mailTitle: 'Email us',
    mailBody:
      'Mention the app, your device and what you did. A screenshot helps.',
    statusBody: 'Is an app not working? Check for an outage on the',
    statusLink: 'status page',
    faqTitle: 'Frequently asked questions',
    faq: {
      delete: {
        q: 'How do I delete my account?',
        a: 'In any app under Account, Delete account. There you choose to erase only that app’s data or your whole AppElent account.',
      },
      account: {
        q: 'Does one account work in every app?',
        a: 'Yes. You sign in with the same account in Gather, Foundry, Fairway and Arcade Club.',
      },
      android: {
        q: 'Are the apps on Android?',
        a: 'Not yet. The apps are on iPhone and in the browser.',
      },
    },
  },
  notFound: {
    eyebrow: '404',
    title: 'This page does not exist.',
    body: 'The link is old or has a typo. The home page lists every app.',
    cta: 'Go to the home page',
  },
}

export type Messages = typeof en
