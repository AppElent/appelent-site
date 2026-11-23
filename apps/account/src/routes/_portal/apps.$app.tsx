// An app page and its tabs; an unknown app is the 404.
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { isAppId } from '../../portal/apps.ts'

export const Route = createFileRoute('/_portal/apps/$app')({
  beforeLoad: ({ params }) => {
    if (!isAppId(params.app)) throw notFound({ routeId: '__root__' })
  },
  component: Outlet,
})
