import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PortalClient } from '../src/portal/contract.ts'
import { localDate } from '../src/portal/export.ts'
import { FakePortalClient } from '../src/portal/fake.ts'
import { AppPage } from '../src/screens/AppPage.tsx'
import { captureDownloads, renderScreen } from './render.tsx'

const usedFoundry = (
  extra: Partial<ConstructorParameters<typeof FakePortalClient>[1]> = {},
) =>
  new FakePortalClient('foundry', {
    summary: {
      contract: 1,
      lastActiveAt: Date.now(),
      counts: [
        { key: 'workoutSessions', count: 184, more: false },
        { key: 'wods', count: 0, more: false },
        { key: 'sets', count: 5402, more: false },
        { key: 'nutritionDiaryEntries', count: 1000, more: true },
        { key: 'futureTable', count: 3, more: false },
      ],
    },
    tables: { workoutSessions: 3, sets: 4 },
    pageSize: 3,
    ...extra,
  })

describe('AppPage', () => {
  it('lists what a used app keeps and downloads its JSON', async () => {
    const downloads = captureDownloads()
    const client = usedFoundry()
    renderScreen(<AppPage app="foundry" />, { clients: { foundry: client } })
    expect(
      await screen.findByRole('heading', { name: 'Foundry', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('In gebruik · laatst actief vandaag'),
    ).toBeInTheDocument()
    const data = screen.getByRole('region', {
      name: 'Wat Foundry van je bewaart',
    })
    expect(within(data).getByText('Sets')).toBeInTheDocument()
    expect(within(data).getByText('5.402')).toBeInTheDocument()
    expect(within(data).getByText('1.000+')).toBeInTheDocument()
    expect(within(data).getByText('Trainingen')).toBeInTheDocument()
    expect(within(data).getByText('Voedingsregels')).toBeInTheDocument()
    // An unknown key still reads, and an empty kind is left out.
    expect(within(data).getByText('Future table')).toBeInTheDocument()
    expect(within(data).queryByText('WOD’s')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Privacybeleid van Foundry/ }),
    ).toHaveAttribute('href', 'https://appelent.nl/privacy#app-foundry')
    expect(screen.getByRole('link', { name: /Open Foundry/ })).toHaveAttribute(
      'href',
      'https://foundry.appelent.nl',
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Download Foundry-gegevens' }),
    )
    await screen.findByRole('button', { name: 'Download Foundry-gegevens' })
    expect(downloads).toEqual([`foundry-${localDate()}.json`])
    expect(client.exportCalls).toEqual([null, '{"page":1}', '{"page":2}'])
  })

  it('says when one download fails', async () => {
    const downloads = captureDownloads()
    renderScreen(<AppPage app="foundry" />, {
      clients: { foundry: usedFoundry({ failExportAtPage: 1 }) },
    })
    await userEvent.click(
      await screen.findByRole('button', { name: 'Download Foundry-gegevens' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Foundry lukte niet. Probeer het zo opnieuw.',
    )
    expect(downloads).toEqual([])
  })

  it('shows an empty state for an unused app, without a download', async () => {
    renderScreen(<AppPage app="arcade" />, {
      clients: { arcade: new FakePortalClient('arcade', { summary: null }) },
    })
    expect(
      await screen.findByRole('heading', {
        name: 'Je hebt Arcade Club nog niet gebruikt',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Download/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Open Arcade Club/ }),
    ).toBeInTheDocument()
  })

  it('lets you retry an unreachable app', async () => {
    const client = usedFoundry({ failSummary: true })
    renderScreen(<AppPage app="foundry" />, { clients: { foundry: client } })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Foundry is nu niet bereikbaar')
    expect(
      screen.queryByRole('button', { name: /Download/ }),
    ).not.toBeInTheDocument()

    client.heal()
    await userEvent.click(
      within(alert).getByRole('button', { name: 'Opnieuw proberen' }),
    )
    expect(
      await screen.findByRole('button', { name: 'Download Foundry-gegevens' }),
    ).toBeInTheDocument()
    expect(client.summaryCalls).toBe(2)
  })

  it('shows a skeleton while loading', async () => {
    const never: PortalClient = {
      summary: () => new Promise(() => {}),
      exportPage: () => new Promise(() => {}),
    }
    const { container } = renderScreen(<AppPage app="gather" />, {
      clients: { gather: never },
    })
    await screen.findByRole('heading', { name: 'Gather' })
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Open Gather/ }),
    ).not.toBeInTheDocument()
  })

  it('speaks English', async () => {
    renderScreen(<AppPage app="foundry" />, {
      clients: { foundry: usedFoundry() },
      locale: 'en',
    })
    expect(
      await screen.findByRole('button', { name: 'Download Foundry data' }),
    ).toBeInTheDocument()
    expect(screen.getByText('5,402')).toBeInTheDocument()
  })

  it('says where to manage connected apps, only for apps with an MCP server', async () => {
    const { unmount } = renderScreen(<AppPage app="foundry" />, {
      clients: { foundry: usedFoundry() },
    })
    const connected = await screen.findByRole('region', {
      name: 'Verbonden apps',
    })
    expect(
      within(connected).getByText(/In Claude: Instellingen › Connectors/),
    ).toBeInTheDocument()
    unmount()

    renderScreen(<AppPage app="fairway" />, {
      clients: {
        fairway: new FakePortalClient('fairway', {
          summary: {
            contract: 1,
            lastActiveAt: Date.now(),
            counts: [{ key: 'rounds', count: 3, more: false }],
          },
        }),
      },
    })
    expect(
      await screen.findByRole('heading', { name: 'Fairway', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Verbonden apps' }),
    ).not.toBeInTheDocument()
  })
})
