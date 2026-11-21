import type { Locale } from './core.ts'
import { en, type Messages } from './en.ts'
import { nl } from './nl.ts'

export * from './core.ts'
export type { Messages } from './en.ts'

export const messages: Record<Locale, Messages> = { nl, en }
