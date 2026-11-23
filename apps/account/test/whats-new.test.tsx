import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FakePortalClient } from '../src/portal/fake.ts'
import { AppPage } from '../src/screens/AppPage.tsx'
import { WhatsNew } from '../src/screens/WhatsNew.tsx'
import { digests } from '../src/whats-new/content.ts'
import type { WeekDigest } from '../src/whats-new/digest.ts'
import { renderScreen } from './render.tsx'

const weeks: WeekDigest[] = [
  {
    week: '2026-W47',
    stage: 'web',
    since: '2026-11-22',
    version: '1.1.0',
    unreleased: true,
    new: [
      {
        title: { nl: 'Winkelmodus', en: 'Shopping mode' },
        body: { nl: 'Grote regels.', en: 'Large rows.' },
        screenshots: [],
      },
    ],
    fixed: [
      { nl: 'Links zijn beter leesbaar.', en: 'Links are easier to read.' },
    ],
  },
  {
    week: '2026-W46',
    stage: null,
    since: null,
    version: '1.0.0',
    unreleased: false,
    new: [
      {
        title: { nl: 'Klantenkaarten', en: 'Loyalty cards' },
        body: { nl: 'Aan de kassa.', en: 'At the till.' },
        screenshots: [],
      },
    ],
    fixed: [],
  },
]

const show = (path = '/', locale: 'nl' | 'en' = 'nl') =>
  renderScreen(<WhatsNew app="gather" weeks={weeks} />, {
    clients: {},
    path,
    locale,
  })

describe('WhatsNew', () => {
  it('opens the newest week and collapses the older ones', async () => {
    show()
    const newest = await screen.findByRole('region', {
      name: 'Week van 16 november',
    })
    expect(within(newest).getByText('Op het web sinds 22 nov')).toBeVisible()
    expect(
      within(newest).getByText('versie 1.1 · nog niet in de App Store'),
    ).toBeVisible()
    expect(within(newest).getByText('Winkelmodus')).toBeVisible()
    expect(within(newest).getByText('Links zijn beter leesbaar.')).toBeVisible()

    const older = screen.getByRole('region', { name: 'Week van 9 november' })
    expect(within(older).getByText('1 wijziging')).toBeVisible()
    expect(within(older).queryByText('Klantenkaarten')).not.toBeInTheDocument()
    await userEvent.click(
      within(older).getByRole('button', { name: 'Toon deze week' }),
    )
    expect(within(older).getByText('Klantenkaarten')).toBeVisible()
  })

  it('keeps the filters in the URL', async () => {
    const { router } = show()
    await userEvent.click(await screen.findByRole('button', { name: 'Nieuw' }))
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ type: 'new' }),
    )
    expect(screen.queryByText('Links zijn beter leesbaar.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Nieuw' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.selectOptions(
      screen.getByLabelText('Versie'),
      screen.getByRole('option', { name: '1.0' }),
    )
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        type: 'new',
        version: '1.0.0',
      }),
    )
    expect(
      screen.getByRole('region', { name: 'Week van 9 november' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Winkelmodus')).toBeNull()
    expect(screen.getByRole('option', { name: '1.1 (komt nog)' })).toBeTruthy()
  })

  it('reads the filters back after a reload, version and date together', async () => {
    show('/?version=1.1.0&from=2026-11-20')
    expect(
      await screen.findByRole('region', { name: 'Week van 16 november' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/9 november/)).toBeNull()
    expect(screen.getByLabelText('Versie')).toHaveValue('1.1.0')
    expect(screen.getByLabelText('Vanaf')).toHaveValue('2026-11-20')
  })

  it('says when nothing matches and clears the filters', async () => {
    const { router } = show('/?from=2026-12-01')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Geen wijzigingen bij deze filters.',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Filters wissen' }),
    )
    await waitFor(() => expect(router.state.location.search).toEqual({}))
    expect(
      screen.getByRole('region', { name: 'Week van 16 november' }),
    ).toBeInTheDocument()
  })

  it('speaks English', async () => {
    show('/', 'en')
    const newest = await screen.findByRole('region', {
      name: 'Week of 16 November',
    })
    expect(within(newest).getByText('On the web since 22 Nov')).toBeVisible()
    expect(within(newest).getByText('Shopping mode')).toBeVisible()
    expect(within(newest).getByText('Fixed and improved')).toBeVisible()
  })

  it('has nothing to report for an app without weeks', async () => {
    renderScreen(<WhatsNew app="fairway" weeks={[]} />, { clients: {} })
    expect(
      await screen.findByText('Nog niets te melden over Fairway.'),
    ).toBeInTheDocument()
  })
})

describe('AppPage tabs', () => {
  it('shows the committed digest on the What’s new tab, whatever the app says', async () => {
    renderScreen(<AppPage app="gather" tab="news" />, {
      clients: {
        gather: new FakePortalClient('gather', {
          summary: null,
          failSummary: true,
        }),
      },
    })
    const tabs = await screen.findByRole('navigation', {
      name: 'Gather: onderdelen',
    })
    expect(
      within(tabs).getByRole('link', { name: 'Wat is er nieuw' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      within(tabs).getByRole('link', { name: 'Jouw gegevens' }),
    ).toHaveAttribute('href', '/apps/gather')
    expect(screen.getByRole('link', { name: /Open Gather/ })).toBeVisible()
    const newest = digests.gather[0]
    expect(newest).toBeDefined()
    expect(
      await screen.findByText(newest?.new[0]?.title.nl ?? ''),
    ).toBeInTheDocument()
    // Screenshots come from this origin, with their size and alt text.
    const img = screen.getAllByRole('img').find((el) => el.tagName === 'IMG')
    expect(img?.getAttribute('src')).toMatch(/^\/.*\.webp/)
    expect(img).toHaveAttribute('alt')
  })

  it('marks the data tab on the data view', async () => {
    renderScreen(<AppPage app="foundry" />, {
      clients: { foundry: new FakePortalClient('foundry', { summary: null }) },
    })
    expect(
      await screen.findByRole('link', { name: 'Jouw gegevens' }),
    ).toHaveAttribute('aria-current', 'page')
  })
})
