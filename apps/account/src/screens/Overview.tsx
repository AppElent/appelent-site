import { Link } from '@tanstack/react-router'
import { AppIcon, Chevron } from '../components/Mark.tsx'
import { useLocale, useMessages } from '../i18n/locale-context.tsx'
import { formatCount, formatDay, isUncounted } from '../i18n/messages.ts'
import { profileRoute } from '../lib/paths.ts'
import {
  type AppId,
  appIds,
  apps,
  countLabel,
  shownCounts,
} from '../portal/apps.ts'
import type { Count } from '../portal/contract.ts'
import { type SummaryState, usePortal } from '../portal/portal-context.tsx'

export interface OverviewUser {
  firstName: string | null
  email: string | null
}

/** "148 recepten · 212 taken · 2 groepen": the first `n` counts. */
export function countsLine(
  app: AppId,
  counts: Count[],
  n: number,
  locale: 'nl' | 'en',
) {
  // An uncounted kind has no number to put in the line.
  return shownCounts(counts)
    .filter((c) => !isUncounted(c))
    .slice(0, n)
    .map(({ key, count, more }) => {
      const label = countLabel(app, key, locale)
      return `${formatCount(count, more, locale)} ${label.charAt(0).toLowerCase()}${label.slice(1)}`
    })
    .join(' · ')
}

function Row({ app, state }: { app: AppId; state: SummaryState }) {
  const t = useMessages().home
  const { locale } = useLocale()
  const info = apps[app]
  if (state.status === 'loading') {
    return (
      <div className="skeleton" aria-hidden="true">
        <span
          className="skeleton-block"
          style={{ width: 48, height: 48, borderRadius: '22%' }}
        />
        <span
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <span className="skeleton-block" style={{ width: 120, height: 14 }} />
          <span
            className="skeleton-block"
            style={{ width: '60%', height: 12 }}
          />
        </span>
      </div>
    )
  }
  const unreachable = state.status === 'unreachable'
  const summary = state.status === 'ready' ? state.summary : null
  const used = summary !== null
  let desktopLine = t.nothingStored
  let phoneLine = t.notUsed
  if (unreachable) {
    desktopLine = t.unreachableLine
    phoneLine = t.unreachable
  } else if (summary) {
    desktopLine = countsLine(app, summary.counts, 3, locale)
    phoneLine = countsLine(app, summary.counts, 2, locale)
  }
  const pill = unreachable ? t.unreachable : used ? t.inUse : t.notUsed
  const pillClass = unreachable
    ? 'pill pill-warn'
    : used
      ? 'pill'
      : 'pill pill-quiet'
  return (
    <Link to="/apps/$app" params={{ app }} className="app-row">
      <AppIcon src={info.icon} size={48} />
      <span className="app-row-text">
        <span className="app-row-name">
          <strong>{info.name}</strong>
          <span className="app-row-kind">{info.kind[locale]}</span>
        </span>
        <span className={unreachable ? 'app-row-line warn' : 'app-row-line'}>
          <span className="line-desktop">{desktopLine}</span>
          <span className="line-phone">{phoneLine}</span>
        </span>
      </span>
      <span className="app-row-status">
        <span className={pillClass}>{pill}</span>
        {summary?.lastActiveAt != null ? (
          <span className="nowrap">
            {t.lastActive(formatDay(summary.lastActiveAt, locale))}
          </span>
        ) : null}
      </span>
      <span className="muted" style={{ display: 'flex' }}>
        <Chevron />
      </span>
    </Link>
  )
}

export function Overview({ user }: { user: OverviewUser }) {
  const t = useMessages().home
  const { locale } = useLocale()
  const { summaries } = usePortal()
  const states = appIds.map((id) => summaries[id])
  const loading = states.some((s) => s.status === 'loading')
  const usedCount = states.filter(
    (s) => s.status === 'ready' && s.summary !== null,
  ).length
  const newUser =
    !loading && states.every((s) => s.status === 'ready' && s.summary === null)
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="h1">{t.hello(user.firstName)}</h1>
        {user.email ? (
          <p className="muted" style={{ margin: 0 }}>
            {user.email}
          </p>
        ) : null}
      </div>
      <div className="split">
        <section
          aria-labelledby="apps-h"
          className="split-main stack"
          style={{ gap: 12 }}
        >
          <div className="section-head">
            <h2 id="apps-h" className="section-title">
              {t.yourApps}
            </h2>
            <span className="muted" style={{ fontSize: 14 }} aria-live="polite">
              {loading ? (
                <span className="visually-hidden">{t.loading}</span>
              ) : (
                t.used(usedCount)
              )}
            </span>
          </div>
          {newUser ? <p className="note">{t.newUserNote}</p> : null}
          <ul className="card app-list" aria-busy={loading}>
            {appIds.map((id) => (
              <li key={id}>
                <Row app={id} state={summaries[id]} />
              </li>
            ))}
          </ul>
        </section>
        <aside className="split-side">
          <section className="card card-pad stack">
            <h2 className="card-title">{t.exportCardTitle}</h2>
            <p className="card-body">{t.exportCardBody}</p>
            <Link
              to="/export"
              className="btn btn-primary btn-small"
              style={{ alignSelf: 'flex-start', marginTop: 6 }}
            >
              {t.exportCardCta}
            </Link>
          </section>
          <section
            className="card card-pad stack"
            style={{ boxShadow: 'none' }}
          >
            <h2 className="card-title">{t.profileCardTitle}</h2>
            <p className="card-body">{t.profileCardBody}</p>
            <Link
              to={profileRoute(locale)}
              params={{ _splat: '' }}
              className="link"
            >
              {t.profileCardCta}
            </Link>
          </section>
          <section className="side-quiet">
            <h2 className="card-title">{t.deleteCardTitle}</h2>
            <p className="card-body">{t.deleteCardBody}</p>
          </section>
        </aside>
      </div>
    </>
  )
}
