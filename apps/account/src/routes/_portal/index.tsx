import { createFileRoute } from '@tanstack/react-router'
import { Overview } from '../../screens/Overview.tsx'
import { usePortalUser } from '../_portal.tsx'

export const Route = createFileRoute('/_portal/')({
  component: () => <Overview user={usePortalUser()} />,
})
