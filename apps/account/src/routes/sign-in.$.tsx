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

function SignInPage() {
  const search = Route.useSearch()
  // Clerk's own steps (`/sign-in/factor-one`, ...) drop the query string, so
  // keep the first value for the whole sign-in.
  const [redirect] = useState(() => search.redirect ?? '/')
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (isLoaded && isSignedIn) router.history.replace(redirect)
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
