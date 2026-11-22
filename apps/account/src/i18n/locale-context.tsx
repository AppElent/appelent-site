import { createContext, type ReactNode, useContext } from 'react'
import { type Locale, localeCookieValue } from './core.ts'
import { type Messages, messages } from './messages.ts'

interface LocaleValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleValue>({
  locale: 'nl',
  setLocale: () => {},
})

export function LocaleProvider({
  value,
  children,
}: {
  value: LocaleValue
  children: ReactNode
}) {
  return <LocaleContext value={value}>{children}</LocaleContext>
}

export const useLocale = () => useContext(LocaleContext)
export const useMessages = (): Messages => messages[useLocale().locale]

/** Remembers the choice for the next visit; `lang` on <html> follows state. */
export function persistLocale(locale: Locale) {
  // biome-ignore lint/suspicious/noDocumentCookie: one first-party preference cookie
  document.cookie = localeCookieValue(locale)
  document.documentElement.lang = locale
}
