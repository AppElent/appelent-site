import { useAuth } from '@clerk/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Footer, LanguageSwitch } from '../components/Shell.tsx'
import { safeRedirect } from '../lib/paths.ts'
import { SignInScreen } from '../screens/Simple.tsx'

// `/sign-in` and Clerk's own steps under it (factor one, SSO callback).
export const Route = createFileRoute('/sign-in/$')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    search.redirect === undefined
      ? {}
      : { redirect: safeRedirect(search.redirect) },
  component: SignInPage,
})

const REDIRECT_KEY = 'ae-sign-in-redirect'

/** The tab's pending return path; storage can be missing or throw. */
const stored = {
  get: () => {
    if (typeof window === 'undefined') return null
    try {
      return sessionStorage.getItem(REDIRECT_KEY)
    } catch {
      return null
    }
  },
  set: (value: string) => {
    try {
      sessionStorage.setItem(REDIRECT_KEY, value)
    } catch {}
  },
  clear: () => {
    try {
      sessionStorage.removeItem(REDIRECT_KEY)
    } catch {}
  },
}

function SignInPage() {
  const search = Route.useSearch()
  const { _splat: step } = Route.useParams()
  // Clerk's own steps (`/sign-in/factor-one`, the SSO callback) drop the
  // query string. Within one page life the router reuses this component, so
  // the path is kept in memory; a reload of a step starts it again, so it is
  // also kept for the tab (validated again when read). `/sign-in` without a
  // `redirect` starts a fresh sign-in and forgets an abandoned one.
  const memory = useRef<string | null>(null)
  const redirect =
    search.redirect ??
    (step ? (memory.current ?? safeRedirect(stored.get() ?? '/')) : '/')
  memory.current = redirect
  useEffect(() => {
    if (search.redirect !== undefined) stored.set(search.redirect)
    else if (!step) stored.clear()
  }, [search.redirect, step])
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  // Forward once per destination: a render while the forward loads must not
  // start it again, but a new destination must still be followed.
  const forwardedTo = useRef<string | null>(null)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || forwardedTo.current === redirect) return
    forwardedTo.current = redirect
    stored.clear()
    router.history.replace(redirect)
  }, [isLoaded, isSignedIn, redirect, router])
  return (
    <div id="root-shell">
      <main className="main" id="main">
        <div className="signin-top">
          <LanguageSwitch />
        </div>
        <SignInScreen redirect={redirect} />
      </main>
      <Footer />
    </div>
  )
}
