import { createFileRoute } from '@tanstack/react-router'
import { isAppId } from '../../portal/apps.ts'
import { AppPage } from '../../screens/AppPage.tsx'
import { type FilterSearch, parseFilters } from '../../whats-new/digest.ts'

// "Wat is er nieuw": the filters live in the query, so a filtered view can be
// shared and survives a reload.
export const Route = createFileRoute('/_portal/apps/$app/whats-new')({
  validateSearch: (search: Record<string, unknown>): FilterSearch =>
    parseFilters(search),
  component: () => {
    const { app } = Route.useParams()
    return isAppId(app) ? <AppPage key={app} app={app} tab="news" /> : null
  },
})
