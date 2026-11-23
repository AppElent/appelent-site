// The "Wat is er nieuw" tab of an app page (APP-628): the weekly digests,
// newest first, filtered by type, version and from-date through the URL query.
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { useLocale, useMessages } from '../i18n/locale-context.tsx'
import { formatShortDay, formatWeekDay } from '../i18n/messages.ts'
import { type AppId, apps } from '../portal/apps.ts'
import { digests, screenshotUrl } from '../whats-new/content.ts'
import {
  applyFilters,
  type Filters,
  parseFilters,
  shortVersion,
  type TypeFilter,
  toFilters,
  toSearch,
  versionsOf,
  type WeekDigest,
  weekStart,
} from '../whats-new/digest.ts'

export function WhatsNew({
  app,
  weeks = digests[app],
}: {
  app: AppId
  weeks?: readonly WeekDigest[]
}) {
  const t = useMessages().news
  const navigate = useNavigate()
  const filters = toFilters(
    parseFilters(useSearch({ strict: false }) as Record<string, unknown>),
  )
  const set = (next: Partial<Filters>) =>
    void navigate({
      to: '.',
      search: toSearch({ ...filters, ...next }),
      replace: true,
    } as never)

  const shown = applyFilters(weeks, filters)
  const filtered =
    filters.type !== 'all' || filters.version !== null || filters.from !== null

  if (weeks.length === 0) {
    return (
      <section className="card panel">
        <p className="muted" style={{ margin: 0 }}>
          {t.empty(apps[app].name)}
        </p>
      </section>
    )
  }

  return (
    <div className="news">
      <FilterBar weeks={weeks} filters={filters} set={set} />
      {shown.length === 0 ? (
        <section className="card panel">
          <p className="muted" style={{ margin: 0 }} role="status">
            {t.noMatch}
          </p>
          {filtered ? (
            <button
              type="button"
              className="btn btn-quiet btn-small"
              onClick={() => set({ type: 'all', version: null, from: null })}
            >
              {t.clear}
            </button>
          ) : null}
        </section>
      ) : (
        shown.map((week, i) => (
          <Week key={week.week} app={app} week={week} open={i === 0} />
        ))
      )}
      <p className="news-foot muted">{t.footnote}</p>
    </div>
  )
}

function FilterBar({
  weeks,
  filters,
  set,
}: {
  weeks: readonly WeekDigest[]
  filters: Filters
  set: (next: Partial<Filters>) => void
}) {
  const t = useMessages().news
  const versions = versionsOf(weeks)
  const types: [TypeFilter, string][] = [
    ['all', t.all],
    ['new', t.new],
    ['fixed', t.fixed],
  ]
  return (
    <div className="news-filters">
      <fieldset className="news-types">
        <legend className="muted">{t.show}</legend>
        {types.map(([type, label]) => (
          <button
            key={type}
            type="button"
            className="chip"
            aria-pressed={filters.type === type}
            onClick={() => set({ type })}
          >
            {label}
          </button>
        ))}
      </fieldset>
      <div className="news-fields">
        <label className="field">
          <span className="muted">{t.version}</span>
          <select
            value={filters.version ?? ''}
            onChange={(e) => set({ version: e.target.value || null })}
          >
            <option value="">{t.allVersions}</option>
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                {t.versionOption(shortVersion(v.version), v.unreleased)}
              </option>
            ))}
            {filters.version &&
            !versions.some((v) => v.version === filters.version) ? (
              <option value={filters.version}>
                {shortVersion(filters.version)}
              </option>
            ) : null}
          </select>
        </label>
        <label className="field">
          <span className="muted">{t.from}</span>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => set({ from: e.target.value || null })}
          />
        </label>
      </div>
    </div>
  )
}

function Week({
  app,
  week,
  open: openFirst,
}: {
  app: AppId
  week: WeekDigest
  open: boolean
}) {
  const t = useMessages().news
  const { locale } = useLocale()
  const [toggled, setToggled] = useState(false)
  const open = openFirst !== toggled
  const headingId = useId()
  const bodyId = useId()
  const since = week.since ? formatShortDay(week.since, locale) : null
  const count = week.new.length + week.fixed.length
  return (
    <section className="news-week" aria-labelledby={headingId}>
      <div className="news-week-head">
        <h2 id={headingId} className="news-week-title">
          {t.weekOf(formatWeekDay(weekStart(week.week), locale))}
        </h2>
        {week.stage ? (
          <span className="pill">{t.stage[week.stage](since)}</span>
        ) : null}
        {week.version ? (
          <span className="muted news-meta">
            {t.versionLine(shortVersion(week.version), week.unreleased)}
          </span>
        ) : null}
        {open ? null : (
          <span className="muted news-meta">{t.changes(count)}</span>
        )}
      </div>
      {open ? (
        <div id={bodyId} className="stack">
          {week.new.map((item, i) => (
            <article key={`${i}-${item.title.en}`} className="card news-item">
              <div className="news-item-text">
                <span className="news-label">{t.newLabel}</span>
                <h3 className="news-item-title">{item.title[locale]}</h3>
                <p className="muted">{item.body[locale]}</p>
              </div>
              {item.screenshots.length > 0 ? (
                <div className="news-shots">
                  {item.screenshots.map((shot) => {
                    const src = screenshotUrl(app, shot.file)
                    return src ? (
                      <img
                        key={shot.file}
                        src={src}
                        width={shot.width}
                        height={shot.height}
                        alt={shot.alt[locale]}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null
                  })}
                </div>
              ) : null}
            </article>
          ))}
          {week.fixed.length > 0 ? (
            <article className="card news-item news-fixed">
              <span className="news-label news-label-quiet">
                {t.fixedLabel}
              </span>
              <ul>
                {week.fixed.map((line, i) => (
                  <li key={`${i}-${line.en}`}>{line[locale]}</li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        className="link news-toggle"
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        onClick={() => setToggled((v) => !v)}
      >
        {open ? t.hideWeek : t.showWeek}
      </button>
    </section>
  )
}
