import { useEffect, useRef, useState } from 'react'
import { AppIcon } from '../components/Mark.tsx'
import { useLocale, useMessages } from '../i18n/locale-context.tsx'
import { formatCount, formatList, formatSize } from '../i18n/messages.ts'
import {
  type AppId,
  appIds,
  apps,
  countKeyForTable,
  countLabel,
  shownCounts,
} from '../portal/apps.ts'
import type { Summary } from '../portal/contract.ts'
import {
  type AppExport,
  buildZip,
  ExportCancelled,
  exportApp,
  localDate,
  type PageProgress,
  saveFile,
} from '../portal/export.ts'
import { type SummaryState, usePortal } from '../portal/portal-context.tsx'

type RowRun =
  | { status: 'waiting' }
  | { status: 'working'; progress: PageProgress | null }
  | { status: 'done'; result: AppExport }
  | { status: 'failed' }

type Phase = 'idle' | 'working' | 'done' | 'error'

interface Zip {
  name: string
  data: Uint8Array
}

/** Apps that go in the zip: every used app, and every app we could not ask. */
function isTarget(state: SummaryState) {
  return (
    state.status === 'unreachable' ||
    (state.status === 'ready' && state.summary !== null)
  )
}

function progressPct(progress: PageProgress | null, summary: Summary | null) {
  if (!progress || !summary) return 0
  const total = summary.counts.reduce((sum, c) => sum + c.count, 0)
  if (total === 0) return 0
  return Math.min(99, Math.round((progress.totalRows / total) * 100))
}

export function Download() {
  const t = useMessages().export
  const { locale } = useLocale()
  const { clients, summaries } = usePortal()
  const [phase, setPhase] = useState<Phase>('idle')
  const [runs, setRuns] = useState<Partial<Record<AppId, RowRun>>>({})
  const [zip, setZip] = useState<Zip | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const abort = useRef<AbortController | null>(null)

  // Leaving the page stops the export at once.
  useEffect(() => () => abort.current?.abort(), [])

  const settled = appIds.every((id) => summaries[id].status !== 'loading')
  const targets = appIds.filter((id) => isTarget(summaries[id]))

  const setRun = (app: AppId, run: RowRun) =>
    setRuns((current) => ({ ...current, [app]: run }))

  function finish(results: AppExport[]) {
    const name = t.fileName(localDate())
    const data = buildZip(results)
    setZip({ name, data })
    saveFile(name, data, 'application/zip')
    setPhase('done')
  }

  /** Exports `apps` one after another, keeping `kept` results. */
  async function run(list: AppId[], kept: AppExport[]) {
    const controller = new AbortController()
    abort.current = controller
    setCancelled(false)
    setPhase('working')
    setRuns((current) => {
      const next = { ...current }
      for (const app of list) next[app] = { status: 'waiting' }
      return next
    })
    const results = [...kept]
    // A retry of one row must not save a zip while other rows still failed:
    // their state is fixed for this run, so read it once here.
    let failed = targets.some(
      (app) => !list.includes(app) && runs[app]?.status === 'failed',
    )
    for (const app of list) {
      const client = clients[app]
      setRun(app, { status: 'working', progress: null })
      try {
        if (!client) throw new Error('No client')
        const state = summaries[app]
        const counted = new Set(
          state.status === 'ready' && state.summary
            ? state.summary.counts.map((c) => c.key)
            : [],
        )
        const result = await exportApp(app, client, {
          signal: controller.signal,
          names: (table) => counted.has(countKeyForTable(app, table)),
          onPage: (progress) => setRun(app, { status: 'working', progress }),
        })
        results.push(result)
        setRun(app, { status: 'done', result })
      } catch (error) {
        if (error instanceof ExportCancelled || controller.signal.aborted) {
          setRuns({})
          setPhase('idle')
          setCancelled(true)
          return
        }
        failed = true
        setRun(app, { status: 'failed' })
      }
    }
    abort.current = null
    if (failed) setPhase('error')
    else finish(results)
  }

  const done = () =>
    targets.flatMap((app) => {
      const r = runs[app]
      return r?.status === 'done' ? [r.result] : []
    })
  const failedApps = targets.filter((app) => runs[app]?.status === 'failed')
  const failedNames = failedApps.map((app) => apps[app].name)

  const start = () => {
    setZip(null)
    setRuns({})
    void run(targets, [])
  }
  const retry = (list: AppId[]) => void run(list, done())
  const cancel = () => abort.current?.abort()

  function status(app: AppId): { text: string; warn?: boolean } {
    const state = summaries[app]
    const r = runs[app]
    if (r?.status === 'done')
      return { text: t.done(formatSize(r.result.bytes, locale)) }
    if (r?.status === 'failed') return { text: t.failed, warn: true }
    if (r?.status === 'waiting') return { text: t.waiting }
    if (r?.status === 'working') {
      const p = r.progress
      if (!p?.table) return { text: t.starting }
      const summary = state.status === 'ready' ? state.summary : null
      const key = countKeyForTable(app, p.table)
      // A Group's table (`groups/<slug>/recipes`) is one Group's share of
      // the count, so it gets no "of <total>".
      const count = p.table.includes('/')
        ? undefined
        : summary?.counts.find((c) => c.key === key)
      const label = countLabel(app, key, locale).toLowerCase()
      return {
        text: t.working(
          label,
          formatCount(p.tableRows, false, locale),
          count ? formatCount(count.count, count.more, locale) : null,
        ),
      }
    }
    if (state.status === 'loading') return { text: t.checking }
    if (state.status === 'unreachable')
      return { text: t.unreachable, warn: true }
    if (state.summary === null) return { text: t.nothing }
    return { text: t.kinds(shownCounts(state.summary.counts).length) }
  }

  return (
    <>
      <div className="intro">
        <h1 className="h1">{t.title}</h1>
        <p className="lead">{t.lead}</p>
      </div>
      <section aria-labelledby="ex-h" className="card export-card">
        <h2 id="ex-h" className="card-title" style={{ marginBottom: 8 }}>
          {t.list}
        </h2>
        <ul className="export-rows">
          {appIds.map((app) => {
            const info = apps[app]
            const s = status(app)
            const r = runs[app]
            const summary =
              summaries[app].status === 'ready'
                ? (summaries[app] as { summary: Summary | null }).summary
                : null
            return (
              <li key={app}>
                <AppIcon src={info.icon} size={36} />
                <span className="export-row-text">
                  <span style={{ fontWeight: 600 }}>{info.name}</span>
                  <span
                    className={
                      s.warn ? 'export-row-status warn' : 'export-row-status'
                    }
                  >
                    {s.text}
                  </span>
                </span>
                {r?.status === 'working' ? (
                  <span
                    className="progress"
                    role="progressbar"
                    aria-label={info.name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPct(r.progress, summary)}
                  >
                    <span
                      style={{ width: `${progressPct(r.progress, summary)}%` }}
                    />
                  </span>
                ) : null}
                {r?.status === 'failed' && phase === 'error' ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    style={{ fontSize: 14, padding: '0 14px' }}
                    onClick={() => retry([app])}
                  >
                    {t.retry}
                    <span className="visually-hidden">: {info.name}</span>
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
        <div className="export-foot">
          {phase === 'idle' ? (
            <>
              {cancelled ? (
                <p role="status" className="full">
                  {t.cancelled}
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn-primary"
                disabled={!settled || targets.length === 0}
                onClick={start}
              >
                {t.makeZip}
              </button>
              <span className="hint">{t.zipHint}</span>
            </>
          ) : null}
          {phase === 'working' ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled
                aria-busy="true"
              >
                {t.making}
              </button>
              <button type="button" className="btn btn-quiet" onClick={cancel}>
                {t.cancel}
              </button>
            </>
          ) : null}
          {phase === 'done' && zip ? (
            <>
              <p role="status" className="full" style={{ fontWeight: 600 }}>
                {t.zipReady(zip.name, formatSize(zip.data.byteLength, locale))}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => saveFile(zip.name, zip.data, 'application/zip')}
              >
                {t.downloadAgain}
              </button>
              <button type="button" className="btn btn-quiet" onClick={start}>
                {t.makeNew}
              </button>
            </>
          ) : null}
          {phase === 'error' ? (
            <>
              <p role="alert" className="full">
                {failedNames.length === 1
                  ? t.partial(failedNames[0] ?? '')
                  : t.partialMany(formatList(failedNames, locale))}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => retry(failedApps)}
              >
                {failedNames.length === 1
                  ? t.retryApp(failedNames[0] ?? '')
                  : t.retry}
              </button>
              {done().length > 0 ? (
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => finish(done())}
                >
                  {failedNames.length === 1
                    ? t.without(failedNames[0] ?? '')
                    : t.withoutMany}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}
