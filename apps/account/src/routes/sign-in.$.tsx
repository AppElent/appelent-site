import { useAuth } from '@clerk/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Footer } from '../components/Shell.tsx'
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
  // Clerk's own steps (`/sign-in/factor-one`, the SSO callback) drop the
  // query string, and a reload there starts this page again: keep the return
  // path for the tab, validated again on the way out.
  const [redirect] = useState(() => {
    if (typeof window === 'undefined') return search.redirect ?? '/'
    if (search.redirect !== undefined) {
      stored.set(search.redirect)
      return search.redirect
    }
    return safeRedirect(stored.get() ?? '/')
  })
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    stored.clear()
    router.history.replace(redirect)
  }, [isLoaded, isSignedIn, redirect, router])
  return (
    <div id="root-shell">
      <main className="main" id="main">
        <SignInScreen redirect={redirect} />
      </main>
      <Footer />
    </div>
  )
}
