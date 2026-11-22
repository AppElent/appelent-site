// Clerk's SignIn and UserProfile, themed with the DS tokens (styles.css) and
// worded like the design. CSS variables follow the OS theme on their own.
import { enUS, nlNL } from '@clerk/localizations'
import type { Locale } from '../i18n/core.ts'
import { messages } from '../i18n/messages.ts'

export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--action)',
    colorPrimaryForeground: 'var(--on-action)',
    colorForeground: 'var(--ink)',
    colorMutedForeground: 'var(--ink-muted)',
    colorBackground: 'var(--surface-raised)',
    colorInput: 'var(--surface)',
    colorInputForeground: 'var(--ink)',
    colorNeutral: 'var(--ink)',
    colorBorder: 'var(--line)',
    colorMuted: 'var(--surface-sunk)',
    colorDanger: 'var(--warn-ink)',
    colorRing: 'var(--focus-ring)',
    colorShadow: 'transparent',
    fontFamily: 'var(--font-text)',
    fontFamilyButtons: 'var(--font-text)',
    fontSize: '1rem',
    borderRadius: '14px',
  },
  elements: {
    rootBox: 'cl-ae-root',
    cardBox: 'cl-ae-card',
    // No sign-up here: accounts are made in the apps. Clerk's footer action
    // (the sign-up link) goes; SignInScreen shows the design's note instead.
    footerAction: 'cl-ae-hidden',
    // The page already shows the AppElent mark next to the card.
    logoBox: 'cl-ae-hidden',
    socialButtonsBlockButton: 'cl-ae-social',
    socialButtonsIconButton: 'cl-ae-social',
    badge: 'cl-ae-badge',
    formButtonPrimary: 'cl-ae-primary',
  },
} as const

export function clerkLocalization(locale: Locale) {
  const t = messages[locale]
  const base = locale === 'nl' ? nlNL : enUS
  const social =
    locale === 'nl'
      ? 'Doorgaan met {{provider|titleize}}'
      : 'Continue with {{provider|titleize}}'
  return {
    ...base,
    socialButtonsBlockButton: social,
    dividerText: locale === 'nl' ? 'of' : 'or',
    formFieldLabel__emailAddress:
      locale === 'nl' ? 'E-mailadres' : 'Email address',
    formButtonPrimary: locale === 'nl' ? 'Doorgaan' : 'Continue',
    signIn: {
      ...base.signIn,
      start: {
        ...base.signIn?.start,
        title: t.signIn.card,
        titleCombined: t.signIn.card,
        subtitle: t.signIn.cardSub,
        subtitleCombined: t.signIn.cardSub,
      },
    },
  }
}
