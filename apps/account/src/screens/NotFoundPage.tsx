import { useAuth, useClerk, useUser } from '@clerk/react'
import { Shell, type ShellUser } from '../components/Shell.tsx'
import { NotFoundScreen } from './Simple.tsx'

export function initials(
  first?: string | null,
  last?: string | null,
  email?: string | null,
) {
  const letters = `${first?.[0] ?? ''}${last?.[0] ?? ''}`
  return (letters || email?.[0] || '?').toUpperCase()
}

/** The signed-in shell's user, or null while signed out or loading. */
export function useShellUser(): ShellUser | null {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const clerk = useClerk()
  if (!isSignedIn || !user) return null
  const email = user.primaryEmailAddress?.emailAddress ?? null
  return {
    initials: initials(user.firstName, user.lastName, email),
    email,
    signOut: () => void clerk.signOut({ redirectUrl: '/sign-in' }),
  }
}

/** Unknown paths: the 404 in the same shell, status 404. */
export function NotFoundPage() {
  const user = useShellUser()
  return (
    <Shell user={user}>
      <NotFoundScreen />
    </Shell>
  )
}
