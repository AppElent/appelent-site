import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import type { AppExport } from '../src/portal/export.ts'
import { zipExports } from '../src/portal/zip.ts'

const file: AppExport = {
  app: 'gather',
  fileName: 'gather.json',
  json: '{"tables":{}}',
  bytes: 13,
}

/** A stand-in Worker that answers with `reply`, or fails. */
function fakeWorker(reply: (files: AppExport[]) => Uint8Array | 'error') {
  const worker = {
    onmessage: null as ((e: { data: Uint8Array }) => void) | null,
    onerror: null as ((e: { preventDefault: () => void }) => void) | null,
    onmessageerror: null,
    terminate: vi.fn(),
    postMessage: (files: AppExport[]) => {
      const answer = reply(files)
      queueMicrotask(() =>
        answer === 'error'
          ? worker.onerror?.({ preventDefault: () => {} })
          : worker.onmessage?.({ data: answer }),
      )
    },
  }
  return worker
}

const names = (zip: Uint8Array) => Object.keys(unzipSync(zip))

describe('zipExports', () => {
  it('uses what the Worker built, then ends it', async () => {
    const built = new Uint8Array([1, 2, 3])
    const worker = fakeWorker(() => built)
    expect(await zipExports([file], () => worker as never)).toBe(built)
    expect(worker.terminate).toHaveBeenCalled()
  })

  it('builds the zip in the page when no Worker starts or it fails', async () => {
    const none = await zipExports([file], () => null)
    expect(names(none)).toEqual(['gather.json'])
    const throws = await zipExports([file], () => {
      throw new Error('blocked')
    })
    expect(names(throws)).toEqual(['gather.json'])
    const failing = fakeWorker(() => 'error')
    const fallback = await zipExports([file], () => failing as never)
    expect(strFromU8(unzipSync(fallback)['gather.json'] as Uint8Array)).toBe(
      file.json,
    )
    expect(failing.terminate).toHaveBeenCalled()
  })
})
