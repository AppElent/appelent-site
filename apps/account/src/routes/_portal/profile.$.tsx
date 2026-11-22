import { createFileRoute } from '@tanstack/react-router'
import { useShellUser } from '../../screens/NotFoundPage.tsx'
import { ProfileScreen } from '../../screens/Simple.tsx'

// Clerk's UserProfile keeps its own pages under this path.
export const Route = createFileRoute('/_portal/profile/$')({
  component: () => (
    <ProfileScreen
      path="/profile"
      signOut={useShellUser()?.signOut ?? (() => {})}
    />
  ),
})
