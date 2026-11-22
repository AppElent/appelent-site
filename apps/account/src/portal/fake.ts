// Fake app clients: unit tests use them, and so does `pnpm dev` with
// `?fake=<scenario>` (dev builds only; see portal-context.tsx) until each app
// deploys `convex/accountPortal.ts` (APP-482). The data is the design's.
import type { AppId } from './apps.ts'
import type { Count, ExportPage, PortalClient, Summary } from './contract.ts'

export interface FakeAppOptions {
  /** `null`: never used the app. */
  summary: Summary | null
  /** Rows per table, exported in pages of `pageSize`. */
  tables?: Record<string, number>
  pageSize?: number
  /** Every summary call rejects (unreachable, or no `accountPortal` yet). */
  failSummary?: boolean
  /** The export rejects on this page (0-based) until `heal()` is called. */
  failExportAtPage?: number
  delayMs?: number
}

export class FakePortalClient implements PortalClient {
  summaryCalls = 0
  exportCalls: (string | null)[] = []
  private failing: boolean

  constructor(
    readonly app: AppId,
    private readonly options: FakeAppOptions,
  ) {
    this.failing = options.failExportAtPage !== undefined
  }

  /** The app comes back: later calls succeed. */
  heal() {
    this.failing = false
    this.options.failSummary = false
  }

  private async wait() {
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs))
    }
  }

  async summary(): Promise<Summary | null> {
    this.summaryCalls++
    await this.wait()
    if (this.options.failSummary) {
      throw new Error(
        "Could not find public function for 'accountPortal:summary'",
      )
    }
    return this.options.summary
  }

  async exportPage(cursor: string | null): Promise<ExportPage> {
    this.exportCalls.push(cursor)
    await this.wait()
    const page = cursor === null ? 0 : Number(JSON.parse(cursor).page)
    if (this.failing && page === this.options.failExportAtPage) {
      throw new Error('Server error')
    }
    const size = this.options.pageSize ?? 500
    // Lay all tables end to end and cut pages of `size` rows.
    const rows: [string, number][] = []
    for (const [table, count] of Object.entries(this.options.tables ?? {})) {
      for (let i = 0; i < count; i++) rows.push([table, i])
    }
    const slice = rows.slice(page * size, (page + 1) * size)
    const tables: Record<string, unknown[]> = {}
    for (const [table, i] of slice) {
      const list = tables[table] ?? []
      tables[table] = list
      list.push({ _id: `${table}_${i}`, n: i })
    }
    const more = (page + 1) * size < rows.length
    return {
      contract: 1,
      app: this.app,
      tables,
      next: more ? JSON.stringify({ page: page + 1 }) : null,
    }
  }
}

const day = 86_400_000
const counts = (entries: [string, number][]): Count[] =>
  entries.map(([key, count]) => ({ key, count, more: false }))

export const designData: Record<
  Exclude<AppId, 'arcade'>,
  { counts: [string, number][]; lastActiveAgo: number }
> = {
  // Keys as each app's `convex/accountPortal.ts` sends them (APP-482).
  gather: {
    counts: [
      ['groups', 2],
      ['recipes', 148],
      ['meals', 36],
      ['plannedMeals', 12],
      ['taskLists', 4],
      ['tasks', 212],
      ['notes', 19],
      ['calendarEvents', 87],
      ['babyEvents', 0],
      ['tastings', 0],
      ['loyaltyCards', 3],
    ],
    lastActiveAgo: 0,
  },
  foundry: {
    counts: [
      ['workoutSessions', 184],
      ['routines', 6],
      ['sets', 5402],
      ['oneRepMaxes', 12],
      ['bodyMetrics', 48],
      ['wodResults', 0],
      ['wods', 0],
      ['exercises', 9],
      ['activities', 245],
      ['enduranceActivityDetails', 61],
      ['nutritionDiaryEntries', 290],
      ['nutritionGoals', 1],
    ],
    lastActiveAgo: day,
  },
  fairway: {
    counts: [
      ['rounds', 23],
      ['shots', 414],
      ['clubs', 14],
      ['courseCopies', 2],
      ['courseSuggestions', 0],
      ['settings', 1],
    ],
    lastActiveAgo: 13 * day,
  },
}

export const scenarios = [
  'regular',
  'new',
  'foundry-down',
  'export-fails',
  'slow',
] as const
export type Scenario = (typeof scenarios)[number]

export function fakeClients(
  scenario: Scenario,
  now = Date.now(),
): Record<AppId, FakePortalClient> {
  const delayMs = scenario === 'slow' ? 1500 : scenario === 'new' ? 0 : 150
  const used = (app: keyof typeof designData): FakeAppOptions => {
    const data = designData[app]
    return {
      summary:
        scenario === 'new'
          ? null
          : {
              contract: 1,
              lastActiveAt: now - data.lastActiveAgo,
              counts: counts(data.counts),
            },
      tables: scenario === 'new' ? {} : Object.fromEntries(data.counts),
      pageSize: 300,
      delayMs,
    }
  }
  const foundry = used('foundry')
  if (scenario === 'foundry-down') foundry.failSummary = true
  if (scenario === 'export-fails') foundry.failExportAtPage = 6
  return {
    gather: new FakePortalClient('gather', used('gather')),
    foundry: new FakePortalClient('foundry', foundry),
    fairway: new FakePortalClient('fairway', used('fairway')),
    arcade: new FakePortalClient('arcade', { summary: null, delayMs }),
  }
}
