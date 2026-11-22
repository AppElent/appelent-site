import { createFileRoute, notFound } from '@tanstack/react-router'
import { isAppId } from '../../portal/apps.ts'
import { AppPage } from '../../screens/AppPage.tsx'

export const Route = createFileRoute('/_portal/apps/$app')({
  beforeLoad: ({ params }) => {
    if (!isAppId(params.app)) throw notFound({ routeId: '__root__' })
  },
  component: () => {
    const { app } = Route.useParams()
    return isAppId(app) ? <AppPage key={app} app={app} /> : null
  },
})
