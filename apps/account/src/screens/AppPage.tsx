import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { AppIcon, Chevron, External } from '../components/Mark.tsx'
import { useLocale, useMessages } from '../i18n/locale-context.tsx'
import { formatCount, formatDay } from '../i18n/messages.ts'
import {
  type AppId,
  apps,
  countLabel,
  privacyUrl,
  shownCounts,
} from '../portal/apps.ts'
import { exportApp, localDate, saveFile } from '../portal/export.ts'
import { usePortal } from '../portal/portal-context.tsx'

/** "Download <App>-gegevens": one JSON file for this app, via `exportPage`. */
function DownloadButton({ app }: { app: AppId }) {
  const t = useMessages().app
  const { clients } = usePortal()
  const [state, setState] = useState<'idle' | 'working' | 'failed'>('idle')
  const abort = useRef<AbortController | null>(null)
  useEffect(() => () => abort.current?.abort(), [])
  const name = apps[app].name
  const start = async () => {
    const client = clients[app]
    if (!client) return setState('failed')
    const controller = new AbortController()
    abort.current = controller
    setState('working')
    try {
      const result = await exportApp(app, client, { signal: controller.signal })
      saveFile(`${app}-${localDate()}.json`, result.json, 'application/json')
      setState('idle')
    } catch {
      if (!controller.signal.aborted) setState('failed')
    }
  }
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        disabled={state === 'working'}
        aria-busy={state === 'working'}
        onClick={start}
      >
        {state === 'working' ? t.downloading : t.download(name)}
      </button>
      {state === 'failed' ? (
        <p
          role="alert"
          className="warn"
          style={{ margin: 0, flex: '1 1 100%', fontSize: 14 }}
        >
          {t.downloadFailed(name)}
        </p>
      ) : null}
    </>
  )
}

export function AppPage({ app }: { app: AppId }) {
  const { app: t, home } = useMessages()
  const { locale } = useLocale()
  const { summaries, reload } = usePortal()
  const info = apps[app]
  const state = summaries[app]
  const summary = state.status === 'ready' ? state.summary : null
  const used = summary !== null
  const unreachable = state.status === 'unreachable'

  let statusLine = ''
  if (unreachable) statusLine = home.unreachableLine
  else if (state.status === 'ready') {
    statusLine = summary
      ? t.statusUsed(
          summary.lastActiveAt != null
            ? formatDay(summary.lastActiveAt, locale)
            : null,
        )
      : home.notUsed
  }

  const openLink = (
    <a
      className="btn btn-outline"
      href={info.webUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t.open(info.name)}
      <External />
      <span className="visually-hidden">{t.newTab}</span>
    </a>
  )

  return (
    <>
      <Link to="/" className="link" style={{ textDecoration: 'none' }}>
        <Chevron back />
        {t.back}
      </Link>
      <div className="app-head">
        <AppIcon src={info.icon} size={72} />
        <div className="app-head-text">
          <p className="eyebrow">{info.kind[locale]}</p>
          <h1 className="h1">{info.name}</h1>
          <p
            className={unreachable ? 'warn' : 'muted'}
            style={{ margin: 0, fontSize: 15, minHeight: 24 }}
            aria-live="polite"
          >
            {statusLine}
          </p>
        </div>
        {state.status === 'ready' ? (
          <div className="actions">
            {used ? <DownloadButton app={app} /> : null}
            {openLink}
          </div>
        ) : null}
      </div>

      {summary ? (
        <div className="split">
          <section
            aria-labelledby="data-h"
            className="card card-pad split-main"
          >
            <h2 id="data-h" className="card-title" style={{ marginBottom: 8 }}>
              {t.dataTitle(info.name)}
            </h2>
            <dl className="data-list">
              {shownCounts(summary.counts).map((c) => (
                <div key={c.key}>
                  <dt>{countLabel(app, c.key, locale)}</dt>
                  <dd>{formatCount(c.count, c.more, locale)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <aside className="split-side">
            <section className="side-teal">
              <h2
                className="card-title"
                style={{ fontSize: 16, lineHeight: '24px' }}
              >
                {t.aboutDownload}
              </h2>
              <p>{info.note[locale]}</p>
            </section>
            <a
              className="link"
              href={privacyUrl(app)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.privacy(info.name)}
              <External />
              <span className="visually-hidden">{t.newTab}</span>
            </a>
          </aside>
        </div>
      ) : null}

      {state.status === 'ready' && !used ? (
        <section className="card panel">
          <h2 className="section-title">{t.emptyTitle(info.name)}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {t.emptyBody(info.name)}
          </p>
        </section>
      ) : null}

      {unreachable ? (
        <section role="alert" className="card panel panel-alert">
          <h2 className="section-title">{t.errorTitle(info.name)}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {t.errorBody}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => reload(app)}
          >
            {t.retry}
          </button>
        </section>
      ) : null}

      {state.status === 'loading' ? (
        <div
          className="card card-pad"
          aria-busy="true"
          style={{ maxWidth: 640 }}
        >
          <span
            className="skeleton-block"
            style={{ display: 'block', width: 200, height: 18 }}
          />
          <span
            className="skeleton-block"
            style={{
              display: 'block',
              width: '70%',
              height: 14,
              marginTop: 16,
            }}
          />
          <span
            className="skeleton-block"
            style={{
              display: 'block',
              width: '50%',
              height: 14,
              marginTop: 12,
            }}
          />
        </div>
      ) : null}
    </>
  )
}
