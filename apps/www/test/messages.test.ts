import { en } from '../src/i18n/en.ts'
import { nl } from '../src/i18n/nl.ts'
import { assertMessageParity } from './support/parity.ts'

type Tree = Parameters<typeof assertMessageParity>[0][string]

assertMessageParity({ en: en as unknown as Tree, nl: nl as unknown as Tree })
