import { createFileRoute } from '@tanstack/react-router'
import { useShellUser } from '../../screens/NotFoundPage.tsx'
import { ProfileScreen } from '../../screens/Simple.tsx'

// Clerk's UserProfile keeps its own pages under this path.
export const Route = createFileRoute('/_portal/profiel/$')({
  component: () => (
    <ProfileScreen
      path="/profiel"
      signOut={useShellUser()?.signOut ?? (() => {})}
    />
  ),
})
