// The four AppElent apps. Display text (kind, one-liner, what each stores)
// lives in the catalog under `apps.<id>`; this module holds only data.

export const appIds = ['gather', 'foundry', 'fairway', 'arcade'] as const
export type AppId = (typeof appIds)[number]

export interface App {
  id: AppId
  name: string
  web: string
  appStoreId: string
  /**
   * LAUNCH STATUS. Eric confirmed 24 Nov 2026: no app is in the App Store
   * yet, so every app is `soon`. `live` shows Apple's App Store badge;
   * `soon` shows the dashed "Binnenkort" / "Coming soon" state and no link.
   * Flip an app by changing this one value.
   */
  appStore: 'live' | 'soon'
}

export const apps: readonly App[] = [
  {
    id: 'gather',
    name: 'Gather',
    web: 'https://gather.appelent.nl',
    appStoreId: '6801454605',
    appStore: 'soon',
  },
  {
    id: 'foundry',
    name: 'Foundry',
    web: 'https://foundry.appelent.nl',
    appStoreId: '6811609419',
    appStore: 'soon',
  },
  {
    id: 'fairway',
    name: 'Fairway',
    web: 'https://fairway.appelent.nl',
    appStoreId: '6833832527',
    appStore: 'soon',
  },
  {
    id: 'arcade',
    name: 'Arcade Club',
    web: 'https://arcade-club.appelent.nl',
    appStoreId: '6832923667',
    appStore: 'soon',
  },
]

export function appStoreUrl(app: App): string {
  return `https://apps.apple.com/app/id${app.appStoreId}`
}
