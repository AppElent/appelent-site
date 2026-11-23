// The export zip, built in a Worker when the browser has one (APP-608). Kept
// apart from export.ts, which the Worker itself imports.
import { type AppExport, buildZip } from './export.ts'

export type MakeWorker = () => Worker | null

const zipWorker: MakeWorker = () =>
  typeof Worker === 'undefined'
    ? null
    : new Worker(new URL('./zip.worker.ts', import.meta.url), {
        type: 'module',
      })

/**
 * Zips the exports in a Worker. When no Worker starts or it fails, the zip is
 * built here instead: slower for the page, but the download still comes.
 */
export function zipExports(
  files: AppExport[],
  makeWorker: MakeWorker = zipWorker,
): Promise<Uint8Array> {
  let worker: Worker | null
  try {
    worker = makeWorker()
  } catch {
    worker = null
  }
  if (!worker) return Promise.resolve(buildZip(files))
  const started = worker
  return new Promise((resolve) => {
    const done = (data: Uint8Array) => {
      started.terminate()
      resolve(data)
    }
    started.onmessage = (event: MessageEvent<Uint8Array>) => done(event.data)
    started.onerror = (event) => {
      event.preventDefault()
      done(buildZip(files))
    }
    started.onmessageerror = () => done(buildZip(files))
    started.postMessage(files)
  })
}
