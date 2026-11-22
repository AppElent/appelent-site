// One typed client per app and the summary state the overview, app page and
// download share. Mounted only beneath the signed-in gate, so signing out
// drops every account-specific value with it.
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { type AppId, appIds } from './apps.ts'
import type { PortalClient, Summary } from './contract.ts'

export type SummaryState =
  | { status: 'loading' }
  | { status: 'ready'; summary: Summary | null }
  | { status: 'unreachable' }

export type PortalClients = Record<AppId, PortalClient | null>

interface PortalValue {
  clients: PortalClients
  summaries: Record<AppId, SummaryState>
  reload: (app: AppId) => void
}

const PortalContext = createContext<PortalValue | null>(null)

const allLoading = () =>
  Object.fromEntries(appIds.map((id) => [id, { status: 'loading' }])) as Record<
    AppId,
    SummaryState
  >

export function PortalProvider({
  clients,
  children,
}: {
  clients: PortalClients
  children: ReactNode
}) {
  const [summaries, setSummaries] = useState(allLoading)
  // The latest request per app wins; a slow earlier one cannot overwrite it.
  const generation = useRef<Record<string, number>>({})

  const load = useCallback(
    (app: AppId) => {
      const id = (generation.current[app] ?? 0) + 1
      generation.current[app] = id
      const set = (state: SummaryState) => {
        if (generation.current[app] !== id) return
        setSummaries((current) => ({ ...current, [app]: state }))
      }
      set({ status: 'loading' })
      const client = clients[app]
      if (!client) {
        set({ status: 'unreachable' })
        return
      }
      client.summary().then(
        (summary) => set({ status: 'ready', summary }),
        // A missing `accountPortal`, a network error, an unknown contract and
        // a timeout all read the same to the person: unreachable right now.
        () => set({ status: 'unreachable' }),
      )
    },
    [clients],
  )

  useEffect(() => {
    for (const app of appIds) load(app)
  }, [load])

  const value = useMemo(
    () => ({ clients, summaries, reload: load }),
    [clients, summaries, load],
  )
  return <PortalContext value={value}>{children}</PortalContext>
}

export function usePortal(): PortalValue {
  const value = useContext(PortalContext)
  if (!value) throw new Error('usePortal outside PortalProvider')
  return value
}
