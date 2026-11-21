import { raw } from './html.ts'

// Decorative inline icons from the approved design (Main.dc.html).

/** The Apple glyph of the dashed "Coming soon" state; the live state uses Apple's badge artwork. */
export const appleGlyph = raw(
  '<svg class="store-soon-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.5-3.9zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z"/></svg>',
)

/** The ↗ arrow after "Open web app". */
export const arrowIcon = raw(
  '<svg class="icon-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8"/></svg>',
)
