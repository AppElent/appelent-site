import { createFileRoute } from '@tanstack/react-router'
import { isAppId } from '../../portal/apps.ts'
import { AppPage } from '../../screens/AppPage.tsx'

export const Route = createFileRoute('/_portal/apps/$app/')({
  component: () => {
    const { app } = Route.useParams()
    return isAppId(app) ? <AppPage key={app} app={app} tab="data" /> : null
  },
})
