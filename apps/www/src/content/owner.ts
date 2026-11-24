// Site-wide contact details and the items Eric still confirms before
// production (APP-480). The public site carries no personal info (Eric, 22 Nov
// 2026): it is a generic AppElent projects showcase. While a `pending` flag is
// true the page renders the item with the dashed `.ph` styling and an HTML
// comment, and `pnpm launch:check` fails, which keeps it off production.

export const owner = {
  /** Eric confirmed 24 Nov 2026. */
  email: 'contact@appelent.nl',
  github: 'https://github.com/AppElent',
}

export const pending = {
  /** Item 1: the contact email (`owner.email`) is confirmed. */
  email: false,
  /** Item 2: launch status per app (`apps.ts`, `appStore`) is confirmed. */
  launchStatus: false,
  /** Item 3: the merged privacy text (catalog `privacy`) is approved. */
  privacy: false,
}

export type PendingItem = keyof typeof pending

export function openPlaceholders(): PendingItem[] {
  return (Object.keys(pending) as PendingItem[]).filter((key) => pending[key])
}
