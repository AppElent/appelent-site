// Lists Eric's open placeholders (src/content/owner.ts) and exits 1 while any
// remain. The future production deploy job runs this before shipping, so the
// dashed placeholders never reach appelent.nl.

import { openPlaceholders } from '../src/content/owner.ts'

const open = openPlaceholders()
if (open.length) {
  console.error(
    `Open placeholders: ${open.join(', ')}. See src/content/owner.ts.`,
  )
  process.exit(1)
}
console.log('No open placeholders.')
