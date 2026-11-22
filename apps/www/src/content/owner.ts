// Site-wide contact details and the items Eric still confirms before
// production (APP-480). The public site carries no personal info (Eric, 22 Nov
// 2026): it is a generic AppElent projects showcase. While a `pending` flag is
// true the page renders the item with the dashed `.ph` styling and an HTML
// comment, and `pnpm launch:check` fails, which keeps it off production.

export const owner = {
  /** PLACEHOLDER (item 1): privacy@appelent.nl is the known default; Eric confirms. */
  email: 'privacy@appelent.nl',
  github: 'https://github.com/AppElent',
}

export const pending = {
  /** Item 1: the contact email (`owner.email`) is confirmed. */
  email: true,
  /** Item 2: launch status per app (`apps.ts`, `appStore`) is confirmed. */
  launchStatus: true,
  /** Item 3: the merged privacy text (catalog `privacy`) is approved. */
  privacy: true,
}

export type PendingItem = keyof typeof pending

export function openPlaceholders(): PendingItem[] {
  return (Object.keys(pending) as PendingItem[]).filter((key) => pending[key])
}
