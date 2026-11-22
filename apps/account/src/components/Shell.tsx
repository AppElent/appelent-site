// Header, tabs and footer around every screen except sign-in's header
// (designs/portal/portal_final.md, Shell).
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { type Locale, locales } from '../i18n/core.ts'
import { useLocale, useMessages } from '../i18n/locale-context.tsx'
import { profileRoute } from '../lib/paths.ts'
import { Mark } from './Mark.tsx'

export interface ShellUser {
  initials: string
  email: string | null
  signOut: () => void
}

type Tab = 'home' | 'export' | 'profile'

function currentTab(pathname: string): Tab | null {
  if (pathname === '/' || pathname.startsWith('/apps/')) return 'home'
  if (pathname === '/export') return 'export'
  if (/^\/(profiel|profile)(\/|$)/.test(pathname)) return 'profile'
  return null
}

function Tabs({ className }: { className: string }) {
  const t = useMessages().shell
  const { locale } = useLocale()
  const tab = currentTab(useLocation().pathname)
  const current = (id: Tab) => (tab === id ? ('page' as const) : undefined)
  return (
    <nav aria-label={t.navLabel} className={`tabs ${className}`}>
      <Link to="/" aria-current={current('home')}>
        {t.tabs.home}
      </Link>
      <Link to="/export" aria-current={current('export')}>
        {t.tabs.export}
      </Link>
      <Link
        to={profileRoute(locale)}
        params={{ _splat: '' }}
        aria-current={current('profile')}
      >
        {t.tabs.profile}
      </Link>
    </nav>
  )
}

function LanguageSwitch() {
  const { locale, setLocale } = useLocale()
  const t = useMessages().shell
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const choose = (next: Locale) => {
    setLocale(next)
    // The profile has a path per language.
    if (currentTab(pathname) === 'profile')
      navigate({ to: profileRoute(next), params: { _splat: '' } })
  }
  return (
    <fieldset className="lang-switch" aria-label={t.langLabel}>
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={code === locale}
          onClick={() => choose(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </fieldset>
  )
}

function AvatarMenu({ user }: { user: ShellUser }) {
  const t = useMessages().shell
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (
        event instanceof MouseEvent &&
        ref.current?.contains(event.target as Node)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  return (
    <div className="avatar-menu" ref={ref}>
      <button
        type="button"
        className="avatar"
        aria-label={t.menuLabel}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        {user.initials}
      </button>
      {open ? (
        <div className="menu">
          {user.email ? <p className="menu-email">{user.email}</p> : null}
          <button type="button" onClick={user.signOut}>
            {t.signOut}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Footer() {
  const t = useMessages().shell
  const { locale } = useLocale()
  const site =
    locale === 'nl' ? 'https://appelent.nl' : 'https://appelent.nl/en'
  return (
    <footer className="footer">
      <div className="footer-bar">
        <span>© 2026 AppElent</span>
        <a href={`${site}/privacy`}>{t.privacy}</a>
        <a href={`${site}/support`}>{t.support}</a>
        <a href={`${site}/`}>appelent.nl</a>
      </div>
    </footer>
  )
}

export function Shell({
  user,
  children,
}: {
  user: ShellUser | null
  children: ReactNode
}) {
  const t = useMessages().shell
  return (
    <div id="root-shell">
      <header className="header">
        <div className="header-bar">
          <Link to="/" className="brand" aria-label={t.homeLabel}>
            <Mark size={32} />
            <span className="brand-name" aria-hidden="true">
              AppElent
            </span>
            <span className="brand-sub" aria-hidden="true">
              {t.account}
            </span>
          </Link>
          <Tabs className="tabs-desktop" />
          <div className="header-end">
            <LanguageSwitch />
            {user ? <AvatarMenu user={user} /> : null}
          </div>
        </div>
        <Tabs className="tabs-phone" />
      </header>
      <main className="main" id="main">
        {children}
      </main>
      <Footer />
    </div>
  )
}
