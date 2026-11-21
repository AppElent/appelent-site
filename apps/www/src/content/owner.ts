// Eric's own content. Everything marked `pending` is a placeholder that Eric
// still supplies (APP-480 "Open at build time"). While a flag is true the page
// renders the placeholder with the dashed `.ph` styling and an HTML comment,
// and `pnpm launch:check` fails, which keeps placeholders off production.
//
// To fill one in: put the real value here (or the text in the catalog, keys
// named in each comment), then set its flag to false.

export const owner = {
  name: 'Eric Jansen',
  /** PLACEHOLDER (item 4): privacy@appelent.nl is the known default; Eric confirms. */
  email: 'privacy@appelent.nl',
  github: 'https://github.com/AppElent',
  /** PLACEHOLDER (item 4): optional LinkedIn URL, or null to drop the slot. */
  linkedin: null as string | null,
  /**
   * PLACEHOLDER (item 1): a square photo (≥400px), committed under
   * `apps/www/assets/`, e.g. 'eric.jpg'. Null shows the dashed "EJ" circle.
   */
  photo: null as string | null,
}

export const pending = {
  /** Item 1: the hero photo (`owner.photo`). */
  photo: owner.photo === null,
  /** Item 2: hero bio sentences, catalog `home.hero.body` (nl + en). */
  bio: true,
  /** Item 3: the third "Wat ik doe" card, catalog `home.does.work` (nl + en). */
  workCard: true,
  /** Item 4: the contact email (`owner.email`) is confirmed. */
  email: true,
  /** Item 4: LinkedIn or other links (`owner.linkedin`) are decided. */
  links: true,
  /** Item 5: launch status per app (`apps.ts`, `appStore`) is confirmed. */
  launchStatus: true,
  /** Item 6: the merged privacy text (catalog `privacy`) is approved. */
  privacy: true,
}

export type PendingItem = keyof typeof pending

export function openPlaceholders(): PendingItem[] {
  return (Object.keys(pending) as PendingItem[]).filter((key) => pending[key])
}
