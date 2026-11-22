import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import type { ExportPage, PortalClient } from '../src/portal/contract.ts'
import {
  buildZip,
  ExportCancelled,
  exportApp,
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
