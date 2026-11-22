// Fetch one app's data page by page (`exportPage` until `next` is null) and
// build the zip in the browser. Nothing leaves the browser except the calls to
// each app's own deployment.
import { strToU8, zipSync } from 'fflate'
import type { AppId } from './apps.ts'
import type { ExportPage, PortalClient } from './contract.ts'

/** A runaway cursor never ends an export; this does. */
export const MAX_PAGES = 10_000

export interface PageProgress {
  /** The table the last page added rows to. */
  table: string | null
  /** Rows so far in that table. */
  tableRows: number
  /** Rows so far across all tables. */
  totalRows: number
}

export interface AppExport {
  app: AppId
  fileName: string
  json: string
  bytes: number
}

export class ExportCancelled extends Error {
  constructor() {
    super('Export cancelled')
    this.name = 'ExportCancelled'
  }
}

/** Runs `start`, but answers an abort at once, even one raised while starting. */
function untilAborted<T>(start: () => Promise<T>, signal?: AbortSignal) {
  if (!signal) return start()
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new ExportCancelled())
    signal.addEventListener('abort', onAbort, { once: true })
    let promise: Promise<T>
    try {
      promise = start()
    } catch (error) {
      signal.removeEventListener('abort', onAbort)
      reject(error)
      return
    }
    if (signal.aborted) {
      signal.removeEventListener('abort', onAbort)
      // Nobody reads this page any more; keep its failure from surfacing.
      promise.catch(() => {})
      reject(new ExportCancelled())
      return
    }
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

export async function exportApp(
  app: AppId,
  client: PortalClient,
  options: {
    signal?: AbortSignal
    onPage?: (progress: PageProgress) => void
    now?: () => Date
  } = {},
): Promise<AppExport> {
  const tables: Record<string, unknown[]> = {}
  const seen = new Set<string>()
  let cursor: string | null = null
  let contract = 1
  let totalRows = 0
  for (let page = 0; ; page++) {
    if (page >= MAX_PAGES) throw new Error('Too many export pages')
    if (options.signal?.aborted) throw new ExportCancelled()
    // Cancel answers at once; a page still in flight is ignored.
    const result: ExportPage = await untilAborted(
      () => client.exportPage(cursor),
      options.signal,
    )
    contract = result.contract
    let table: string | null = null
    for (const [name, rows] of Object.entries(result.tables)) {
      const into = tables[name] ?? []
      tables[name] = into
      for (const row of rows) into.push(row)
      totalRows += rows.length
      // The page's first table with rows names the step: an app adds its
      // related tables (sessions, catalog tees) after the one it pages over.
      if (rows.length > 0 && table === null) table = name
    }
    options.onPage?.({
      table,
      tableRows: table ? (tables[table]?.length ?? 0) : 0,
      totalRows,
    })
    if (result.next === null) break
    if (seen.has(result.next)) throw new Error('Export cursor repeated')
    seen.add(result.next)
    cursor = result.next
  }
  if (options.signal?.aborted) throw new ExportCancelled()
  const exportedAt = (options.now?.() ?? new Date()).toISOString()
  const json = JSON.stringify(
    { contract, app, exportedAt, tables },
    jsonValue,
    2,
  )
  return {
    app,
    fileName: `${app}.json`,
    json,
    bytes: new TextEncoder().encode(json).byteLength,
  }
}

/**
 * Convex values JSON cannot hold: an int64 arrives as a BigInt (which
 * JSON.stringify throws on) and bytes as an ArrayBuffer (which it writes as
 * `{}`). Write them as a decimal string and base64.
 */
export function jsonValue(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString()
  // Convex stores NaN and ±Infinity; JSON would write them as null.
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value)
  if (value instanceof ArrayBuffer) {
    let binary = ''
    for (const byte of new Uint8Array(value))
      binary += String.fromCharCode(byte)
    return btoa(binary)
  }
  return value
}

export function buildZip(files: AppExport[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {}
  for (const file of files) entries[file.fileName] = strToU8(file.json)
  return zipSync(entries, { level: 6 })
}

/** Hands the browser a file to save. */
export function saveFile(
  name: string,
  data: Uint8Array | string,
  type: string,
) {
  const blob = new Blob([data as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  // Give the download a moment to start before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** "2026-11-22" in the person's own time zone. */
export function localDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
