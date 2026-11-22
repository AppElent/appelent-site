// Every signed-in screen. Signed-out visits go to /sign-in and come back to
// where they were. The per-app clients and their data live only below the
// gate, keyed by user, so signing out or switching accounts drops them.
import { useAuth, useUser } from '@clerk/react'
import {
  createFileRoute,
  Outlet,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import { useEffect, useMemo, useRef } from 'react'
import { Shell } from '../components/Shell.tsx'
import { convexUrls } from '../config.ts'
import { type AppId, appIds } from '../portal/apps.ts'
import { createConvexPortalClient } from '../portal/convex-client.ts'
import { devScenario } from '../portal/dev-fakes.ts'
import {
  type PortalClients,
  PortalProvider,
} from '../portal/portal-context.tsx'
import { useShellUser } from '../screens/NotFoundPage.tsx'

export const Route = createFileRoute('/_portal')({
  component: PortalLayout,
})

function PortalLayout() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const router = useRouter()
  const user = useShellUser()
  const redirected = useRef(false)
  useEffect(() => {
    // Once only: after `navigate`, this layout renders again with the
    // sign-in URL before it unmounts, which would otherwise nest `redirect`.
    if (!isLoaded || isSignedIn || redirected.current) return
    if (location.pathname.startsWith('/sign-in')) return
    redirected.current = true
    void router.navigate({
      to: '/sign-in/$',
      params: { _splat: '' },
      search: { redirect: location.href },
      replace: true,
    })
  }, [isLoaded, isSignedIn, location.href, location.pathname, router])
  useEffect(() => {
    if (isSignedIn) redirected.current = false
  }, [isSignedIn])
  if (!isLoaded || !isSignedIn) {
    return (
      <Shell user={null}>
        <div aria-busy="true" style={{ minHeight: 320 }} />
      </Shell>
    )
  }
  return (
    <Shell user={user}>
      <SignedIn />
    </Shell>
  )
}

function SignedIn() {
  const { getToken, userId } = useAuth()
  const tokenRef = useRef(getToken)
  tokenRef.current = getToken
  const clients = useMemo<PortalClients>(() => {
    const fakes = devScenario()
    if (fakes) return fakes
    const token = () => tokenRef.current({ template: 'convex' })
    return Object.fromEntries(
      appIds.map((app: AppId) => {
        const url = convexUrls[app]
        return [app, url ? createConvexPortalClient(app, url, token) : null]
      }),
    ) as PortalClients
  }, [])
  return (
    <PortalProvider key={userId} clients={clients}>
      <Outlet />
    </PortalProvider>
  )
}

export function usePortalUser() {
  const { user } = useUser()
  return {
    firstName: user?.firstName ?? null,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  }
}
