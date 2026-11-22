import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { unzipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import type { AppId } from '../src/portal/apps.ts'
import type { ExportPage, PortalClient } from '../src/portal/contract.ts'
import { localDate } from '../src/portal/export.ts'
import { type FakeAppOptions, FakePortalClient } from '../src/portal/fake.ts'
import { Download } from '../src/screens/Download.tsx'
import { captureDownloads, deferred, renderScreen } from './render.tsx'

const used = (
  app: AppId,
  tables: Record<string, number>,
  extra: Partial<FakeAppOptions> = {},
) =>
  new FakePortalClient(app, {
    summary: {
      contract: 1,
      lastActiveAt: null,
      counts: Object.entries(tables).map(([key, count]) => ({
        key,
        count,
        more: false,
      })),
    },
    tables,
    pageSize: 2,
    ...extra,
  })

/** Captures the zips handed to the browser, as file name → entries. */
function captureZips() {
  const blobs: Blob[] = []
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:test'
  })
  return async () =>
    Promise.all(
      blobs.map(async (blob) =>
        Object.keys(unzipSync(new Uint8Array(await blob.arrayBuffer()))).sort(),
      ),
    )
}

const row = (name: string) =>
  screen
    .getByText(name, { selector: '.export-row-text > span' })
    .closest('li') as HTMLElement

describe('Download', () => {
  it('lists each app and waits until all are known', async () => {
    renderScreen(<Download />, {
      clients: {
        gather: used('gather', { recipes: 3, tasks: 1 }),
        foundry: used('foundry', { sets: 2 }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    expect(await screen.findByText('2 soorten gegevens')).toBeInTheDocument()
    expect(
      within(row('Foundry')).getByText('1 soort gegevens'),
    ).toBeInTheDocument()
    expect(
      within(row('Arcade Club')).getByText('Niets te downloaden'),
    ).toBeInTheDocument()
    expect(
      within(row('Fairway')).getByText('Niet bereikbaar'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zip maken' })).toBeEnabled()
  })

  it('builds one zip with a JSON file per used app', async () => {
    const downloads = captureDownloads()
    const zips = captureZips()
    renderScreen(<Download />, {
      clients: {
        gather: used('gather', { recipes: 3 }),
        foundry: used('foundry', { sets: 2 }),
        fairway: new FakePortalClient('fairway', { summary: null }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    const name = `appelent-gegevens-${localDate()}.zip`
    expect(await screen.findByRole('status')).toHaveTextContent(
      new RegExp(`Klaar: ${name} \\(0,1 MB\\) staat in je downloads.`),
    )
    expect(downloads).toEqual([name])
    expect(await zips()).toEqual([['foundry.json', 'gather.json']])
    expect(within(row('Gather')).getByText(/^Klaar · /)).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Opnieuw downloaden' }),
    )
    expect(downloads).toEqual([name, name])
    expect(
      screen.getByRole('button', { name: 'Nieuwe zip maken' }),
    ).toBeInTheDocument()
  })

  it('shows progress per app and can be cancelled', async () => {
    const downloads = captureDownloads()
    const gate = deferred()
    const inner = used('foundry', { sets: 6 })
    const slow: PortalClient = {
      summary: () => inner.summary(),
      exportPage: async (cursor): Promise<ExportPage> => {
        const page = await inner.exportPage(cursor)
        if (cursor !== null) await gate.promise
        return page
      },
    }
    renderScreen(<Download />, {
      clients: {
        foundry: slow,
        gather: new FakePortalClient('gather', { summary: null }),
        fairway: new FakePortalClient('fairway', { summary: null }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    const bar = await screen.findByRole('progressbar', { name: 'Foundry' })
    expect(bar).toHaveAttribute('aria-valuenow', '33')
    expect(
      within(row('Foundry')).getByText('Bezig · sets 2 van 6'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bezig met maken…' }),
    ).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Annuleren' }))
    gate.resolve()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Geannuleerd. Er is niets gedownload.',
    )
    expect(screen.getByRole('button', { name: 'Zip maken' })).toBeEnabled()
    expect(downloads).toEqual([])
  })

  it('names export tables by their count key, without a total for one Group', async () => {
    const gate = deferred()
    const inner = used(
      'gather',
      { 'groups/thuis/mealEntries': 6 },
      {
        summary: {
          contract: 1,
          lastActiveAt: null,
          counts: [{ key: 'meals', count: 9, more: false }],
        },
      },
    )
    const gated = (client: PortalClient): PortalClient => ({
      summary: () => client.summary(),
      exportPage: async (cursor) => {
        const page = await client.exportPage(cursor)
        if (cursor !== null) await gate.promise
        return page
      },
    })
    renderScreen(<Download />, {
      clients: {
        gather: gated(inner),
        foundry: new FakePortalClient('foundry', { summary: null }),
        fairway: new FakePortalClient('fairway', { summary: null }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    expect(
      await within(row('Gather')).findByText('Bezig · maaltijden 2'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Annuleren' }))
    gate.resolve()
    await screen.findByRole('status')
  })

  it('names an aliased table with its total', async () => {
    const gate = deferred()
    const inner = used(
      'fairway',
      { courses: 6 },
      {
        summary: {
          contract: 1,
          lastActiveAt: null,
          counts: [{ key: 'courseCopies', count: 6, more: false }],
        },
      },
    )
    renderScreen(<Download />, {
      clients: {
        gather: new FakePortalClient('gather', { summary: null }),
        foundry: new FakePortalClient('foundry', { summary: null }),
        fairway: {
          summary: () => inner.summary(),
          exportPage: async (cursor) => {
            const page = await inner.exportPage(cursor)
            if (cursor !== null) await gate.promise
            return page
          },
        },
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    expect(
      await within(row('Fairway')).findByText('Bezig · eigen banen 2 van 6'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Annuleren' }))
    gate.resolve()
    await screen.findByRole('status')
  })

  it('offers retry or a zip without the app that failed', async () => {
    const downloads = captureDownloads()
    const zips = captureZips()
    const foundry = used('foundry', { sets: 6 }, { failExportAtPage: 1 })
    renderScreen(<Download />, {
      clients: {
        gather: used('gather', { recipes: 3 }),
        foundry,
        fairway: used('fairway', { rounds: 1 }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Foundry lukte niet. De rest is klaar.',
    )
    expect(within(row('Foundry')).getByText('Niet gelukt')).toBeInTheDocument()
    expect(within(row('Fairway')).getByText(/^Klaar · /)).toBeInTheDocument()
    expect(downloads).toEqual([])

    await userEvent.click(
      screen.getByRole('button', { name: 'Downloaden zonder Foundry' }),
    )
    expect(await zips()).toEqual([['fairway.json', 'gather.json']])
    expect(downloads).toHaveLength(1)
  })

  it('retries only the failed app and keeps the rest', async () => {
    const zips = captureZips()
    captureDownloads()
    const gather = used('gather', { recipes: 3 })
    const foundry = used('foundry', { sets: 6 }, { failExportAtPage: 1 })
    renderScreen(<Download />, {
      clients: {
        gather,
        foundry,
        fairway: new FakePortalClient('fairway', { summary: null }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    await screen.findByRole('alert')
    const gatherCalls = gather.exportCalls.length

    foundry.heal()
    await userEvent.click(
      screen.getByRole('button', { name: 'Foundry opnieuw proberen' }),
    )
    await screen.findByRole('status')
    expect(gather.exportCalls).toHaveLength(gatherCalls)
    expect(await zips()).toEqual([['foundry.json', 'gather.json']])
  })

  it('does not save a zip while another app still failed', async () => {
    const zips = captureZips()
    captureDownloads()
    const foundry = used('foundry', { sets: 2 }, { failExportAtPage: 0 })
    const fairway = used('fairway', { holeScores: 2 }, { failExportAtPage: 0 })
    renderScreen(<Download />, {
      clients: {
        gather: used('gather', { recipes: 1 }),
        foundry,
        fairway,
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Zip maken' }),
    )
    await screen.findByRole('alert')
    foundry.heal()
    await userEvent.click(
      within(row('Foundry')).getByRole('button', { name: /^Opnieuw proberen/ }),
    )
    expect(
      await screen.findByRole('button', { name: 'Downloaden zonder Fairway' }),
    ).toBeInTheDocument()
    expect(await zips()).toEqual([])
    expect(within(row('Fairway')).getByText('Niet gelukt')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Downloaden zonder Fairway' }),
    )
    expect(await zips()).toEqual([['foundry.json', 'gather.json']])
  })

  it('tries an unreachable app too, and names several failures', async () => {
    captureDownloads()
    renderScreen(<Download />, {
      clients: {
        gather: used('gather', { recipes: 1 }),
        foundry: used(
          'foundry',
          { sets: 1 },
          { failSummary: true, failExportAtPage: 0 },
        ),
        fairway: null,
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    expect(await screen.findAllByText('Niet bereikbaar')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Zip maken' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Foundry en Fairway lukten niet. De rest is klaar.',
    )
    expect(
      screen.getByRole('button', { name: 'Downloaden zonder deze apps' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: /^Opnieuw proberen/ }).length,
    ).toBeGreaterThanOrEqual(3)
  })

  it('has nothing to build for a new account', async () => {
    renderScreen(<Download />, {
      clients: {
        gather: new FakePortalClient('gather', { summary: null }),
        foundry: new FakePortalClient('foundry', { summary: null }),
        fairway: new FakePortalClient('fairway', { summary: null }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
    })
    await waitFor(() =>
      expect(screen.getAllByText('Niets te downloaden')).toHaveLength(4),
    )
    expect(screen.getByRole('button', { name: 'Zip maken' })).toBeDisabled()
  })

  it('speaks English', async () => {
    captureDownloads()
    renderScreen(<Download />, {
      clients: {
        gather: used('gather', { recipes: 1 }),
        foundry: new FakePortalClient('foundry', { summary: null }),
        fairway: new FakePortalClient('fairway', { summary: null }),
        arcade: new FakePortalClient('arcade', { summary: null }),
      },
      locale: 'en',
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Build zip' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      `Done: appelent-data-${localDate()}.zip`,
    )
  })
})
