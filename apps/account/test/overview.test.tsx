import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AppId } from '../src/portal/apps.ts'
import type { PortalClient } from '../src/portal/contract.ts'
import { FakePortalClient, fakeClients } from '../src/portal/fake.ts'
import { Overview } from '../src/screens/Overview.tsx'
import { renderScreen } from './render.tsx'

const user = { firstName: 'Sam', email: 'sam@example.com' }
const never: PortalClient = {
  summary: () => new Promise(() => {}),
  exportPage: () => new Promise(() => {}),
}
const instant = (scenario: Parameters<typeof fakeClients>[0]) => {
  const clients = fakeClients(scenario)
  for (const client of Object.values(clients)) {
    ;(client as unknown as { options: { delayMs: number } }).options.delayMs = 0
  }
  return clients
}
const row = (name: string) =>
  screen.getByRole('link', { name: new RegExp(`^${name}`) })

describe('Overview', () => {
  it('shows skeletons while the apps load', async () => {
    renderScreen(<Overview user={user} />, {
      clients: { gather: never, foundry: never, fairway: never, arcade: never },
    })
    expect(
      await screen.findByRole('heading', { name: 'Hoi Sam' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Je apps laden…')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /^Gather/ }),
    ).not.toBeInTheDocument()
  })

  it('shows used apps with counts and last activity', async () => {
    renderScreen(<Overview user={user} />, { clients: instant('regular') })
    expect(await screen.findByText('3 van 4 in gebruik')).toBeInTheDocument()
    const gather = row('Gather')
    expect(
      within(gather).getByText('2 groepen · 148 recepten · 36 maaltijden'),
    ).toBeInTheDocument()
    expect(within(gather).getByText('In gebruik')).toBeInTheDocument()
    expect(
      within(gather).getByText('Laatst actief vandaag'),
    ).toBeInTheDocument()
    expect(
      within(row('Foundry')).getByText('Laatst actief gisteren'),
    ).toBeInTheDocument()
    expect(
      within(row('Arcade Club')).getAllByText('Nog niet gebruikt').length,
    ).toBeGreaterThan(0)
    expect(row('Gather')).toHaveAttribute('href', '/apps/gather')
  })

  it('marks one unreachable app without hiding the others', async () => {
    renderScreen(<Overview user={user} />, { clients: instant('foundry-down') })
    expect(await screen.findByText('2 van 4 in gebruik')).toBeInTheDocument()
    const foundry = row('Foundry')
    expect(
      within(foundry).getByText(
        'Nu niet bereikbaar. Je andere apps werken gewoon.',
      ),
    ).toBeInTheDocument()
    expect(
      within(foundry).getAllByText('Niet bereikbaar').length,
    ).toBeGreaterThan(0)
    expect(within(row('Gather')).getByText('In gebruik')).toBeInTheDocument()
  })

  it('treats an app without a configured deployment as unreachable', async () => {
    const clients: Partial<Record<AppId, PortalClient | null>> =
      instant('regular')
    clients.fairway = null
    renderScreen(<Overview user={user} />, { clients })
    expect(await screen.findByText('2 van 4 in gebruik')).toBeInTheDocument()
    expect(
      within(row('Fairway')).getAllByText('Niet bereikbaar').length,
    ).toBeGreaterThan(0)
  })

  it('welcomes a new account', async () => {
    renderScreen(<Overview user={{ firstName: null, email: null }} />, {
      clients: instant('new'),
    })
    expect(await screen.findByText('Nog geen app gebruikt')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Je hebt nog geen van de apps gebruikt. Open er een; je logt in met dit account.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hoi' })).toBeInTheDocument()
  })

  it('speaks English', async () => {
    renderScreen(<Overview user={user} />, {
      clients: instant('regular'),
      locale: 'en',
    })
    expect(await screen.findByText('3 of 4 in use')).toBeInTheDocument()
    expect(
      within(row('Gather')).getByText('2 groups · 148 recipes · 36 meals'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open profile' })).toHaveAttribute(
      'href',
      '/profile',
    )
  })

  it('asks each app once on load', async () => {
    const gather = new FakePortalClient('gather', { summary: null })
    renderScreen(<Overview user={user} />, { clients: { gather } })
    await screen.findByText('Nog geen app gebruikt')
    expect(gather.summaryCalls).toBe(1)
  })
})
