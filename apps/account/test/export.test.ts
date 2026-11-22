import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import type { ExportPage, PortalClient } from '../src/portal/contract.ts'
import {
  buildZip,
  ExportCancelled,
  exportApp,
  jsonValue,
  localDate,
} from '../src/portal/export.ts'
import { FakePortalClient } from '../src/portal/fake.ts'

const fake = (tables: Record<string, number>, pageSize = 2) =>
  new FakePortalClient('gather', {
    summary: null,
    tables,
    pageSize,
  })

describe('exportApp', () => {
  it('walks every page and merges the tables', async () => {
    const client = fake({ recipes: 3, tasks: 2 })
    const pages: number[] = []
    const result = await exportApp('gather', client, {
      onPage: (p) => pages.push(p.totalRows),
      now: () => new Date('2026-11-22T10:00:00Z'),
    })
    expect(client.exportCalls).toEqual([null, '{"page":1}', '{"page":2}'])
    expect(pages).toEqual([2, 4, 5])
    const file = JSON.parse(result.json)
    expect(result.fileName).toBe('gather.json')
    expect(file).toMatchObject({
      contract: 1,
      app: 'gather',
      exportedAt: '2026-11-22T10:00:00.000Z',
    })
    expect(file.tables.recipes).toHaveLength(3)
    expect(file.tables.tasks).toHaveLength(2)
    expect(result.bytes).toBe(new TextEncoder().encode(result.json).byteLength)
  })

  it('reports the table and its rows so far', async () => {
    const seen: string[] = []
    await exportApp('gather', fake({ recipes: 3 }), {
      onPage: (p) => seen.push(`${p.table}:${p.tableRows}`),
    })
    expect(seen).toEqual(['recipes:2', 'recipes:3'])
  })

  it('names a page by its counted table, whatever the key order', async () => {
    const page: ExportPage = {
      contract: 1,
      app: 'arcade',
      // Sorted, the way Convex returns object keys.
      tables: {
        gameSessions: [{ _id: 's1' }],
        quizAnswers: [{ _id: 'a1' }, { _id: 'a2' }],
        sessionParticipants: [{ _id: 'p1' }],
      },
      next: null,
    }
    const client: PortalClient = {
      summary: async () => null,
      exportPage: async () => page,
    }
    const seen: string[] = []
    await exportApp('arcade', client, {
      onPage: (p) => seen.push(`${p.table}:${p.tableRows}`),
      names: (table) => table === 'sessionParticipants',
    })
    await exportApp('arcade', client, {
      onPage: (p) => seen.push(`${p.table}:${p.tableRows}`),
    })
    expect(seen).toEqual(['sessionParticipants:1', 'gameSessions:1'])
  })

  it('stops between pages when cancelled', async () => {
    const controller = new AbortController()
    const client = fake({ recipes: 10 })
    await expect(
      exportApp('gather', client, {
        signal: controller.signal,
        onPage: () => controller.abort(),
      }),
    ).rejects.toBeInstanceOf(ExportCancelled)
    expect(client.exportCalls).toHaveLength(1)
  })

  it('answers a cancel while a page is still loading', async () => {
    const controller = new AbortController()
    const never: PortalClient = {
      summary: async () => null,
      exportPage: () => new Promise<ExportPage>(() => {}),
    }
    const pending = exportApp('gather', never, { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toBeInstanceOf(ExportCancelled)
  })

  it('swallows a page that fails after a cancel raised while it starts', async () => {
    const controller = new AbortController()
    const aborting: PortalClient = {
      summary: async () => null,
      exportPage: () => {
        controller.abort()
        return Promise.reject(new Error('Server error'))
      },
    }
    await expect(
      exportApp('gather', aborting, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ExportCancelled)
  })

  it('answers a cancel raised while a page starts', async () => {
    const controller = new AbortController()
    const aborting: PortalClient = {
      summary: async () => null,
      exportPage: () => {
        controller.abort()
        return new Promise<ExportPage>(() => {})
      },
    }
    await expect(
      exportApp('gather', aborting, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ExportCancelled)
  })

  it('fails on a repeated cursor instead of looping', async () => {
    const looping: PortalClient = {
      summary: async () => null,
      exportPage: async (): Promise<ExportPage> => ({
        contract: 1,
        app: 'gather',
        tables: {},
        next: 'same',
      }),
    }
    await expect(exportApp('gather', looping)).rejects.toThrow(
      'cursor repeated',
    )
  })

  it('passes on a failing page', async () => {
    const client = new FakePortalClient('gather', {
      summary: null,
      tables: { recipes: 10 },
      pageSize: 2,
      failExportAtPage: 1,
    })
    await expect(exportApp('gather', client)).rejects.toThrow('Server error')
  })
})

describe('buildZip', () => {
  it('puts one <app>.json per export in the zip', async () => {
    const gather = await exportApp('gather', fake({ recipes: 1 }))
    const arcade = await exportApp(
      'arcade',
      new FakePortalClient('arcade', { summary: null, tables: { scores: 2 } }),
    )
    const files = unzipSync(buildZip([gather, arcade]))
    expect(Object.keys(files).sort()).toEqual(['arcade.json', 'gather.json'])
    expect(
      JSON.parse(strFromU8(files['arcade.json'] as Uint8Array)).tables.scores,
    ).toHaveLength(2)
  })
})

describe('localDate', () => {
  it('formats the local day', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('jsonValue', () => {
  it('writes int64 as a string and bytes as base64', () => {
    const json = JSON.stringify(
      {
        n: 12345678901234567890n,
        b: new Uint8Array([104, 105]).buffer,
        rows: [{ f: Number.NaN, g: Number.NEGATIVE_INFINITY, h: 1.5 }],
      },
      jsonValue,
    )
    expect(JSON.parse(json)).toEqual({
      n: '12345678901234567890',
      b: 'aGk=',
      rows: [{ f: 'NaN', g: '-Infinity', h: 1.5 }],
    })
  })
})
