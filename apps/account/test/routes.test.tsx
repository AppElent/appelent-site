// The signed-in gate, the way back after signing in, and the 404, with the
// real route components and Clerk replaced by a switchable fake session.

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  type RouteComponent,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Locale } from '../src/i18n/core.ts'
import { LocaleProvider } from '../src/i18n/locale-context.tsx'

const session = vi.hoisted(() => ({ isLoaded: true, isSignedIn: false }))
const signIn = vi.hoisted(() => vi.fn())
vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    ...session,
    userId: 'user_1',
    getToken: async () => 'jwt',
  }),
  useUser: () => ({
    user: session.isSignedIn
      ? {
          firstName: 'Sam',
          lastName: 'D',
          primaryEmailAddress: { emailAddress: 'sam@example.com' },
        }
      : null,
  }),
  useClerk: () => ({ signOut: vi.fn() }),
  SignIn: (props: { forceRedirectUrl: string }) => {
    signIn(props)
    return <div>clerk sign-in</div>
  },
  UserProfile: (props: { path: string }) => (
    <div>clerk profile at {props.path}</div>
  ),
}))

const { Route: PortalRoute } = await import('../src/routes/_portal.tsx')
const { Route: SignInRoute } = await import('../src/routes/sign-in.$.tsx')
const { Route: ExportRoute } = await import('../src/routes/_portal/export.tsx')
const { Route: ProfielRoute } = await import(
  '../src/routes/_portal/profiel.$.tsx'
)
const { Route: ProfileRoute } = await import(
  '../src/routes/_portal/profile.$.tsx'
)
const { NotFoundPage } = await import('../src/screens/NotFoundPage.tsx')

const component = (route: { options: { component?: unknown } }) =>
  route.options.component as RouteComponent

function renderAt(
  path: string,
  locale: Locale = 'nl',
  setLocale: (locale: Locale) => void = () => {},
) {
  const root = createRootRoute({
    component: () => (
      <LocaleProvider value={{ locale, setLocale }}>
        <Outlet />
      </LocaleProvider>
    ),
    notFoundComponent: NotFoundPage,
  })
  const signIn = createRoute({
    getParentRoute: () => root,
    path: 'sign-in/$',
    validateSearch: SignInRoute.options.validateSearch,
    component: component(SignInRoute),
  })
  const portal = createRoute({
    getParentRoute: () => root,
    id: '_portal',
    component: component(PortalRoute),
  })
  const child = (path: string, route: { options: { component?: unknown } }) =>
    createRoute({
      getParentRoute: () => portal,
      path,
      component: component(route),
    })
  const router = createRouter({
    routeTree: root.addChildren([
      signIn,
      portal.addChildren([
        child('/', { options: { component: () => <p>overview</p> } }),
        child('export', ExportRoute),
        child('profiel/$', ProfielRoute),
        child('profile/$', ProfileRoute),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(<RouterProvider router={router as never} />)
  return router
}

describe('routes', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    session.isLoaded = true
    session.isSignedIn = false
    signIn.mockClear()
    sessionStorage.clear()
  })

  it('sends a signed-out visit to sign-in, once, with the way back', async () => {
    const router = renderAt('/export?x=1')
    await screen.findByText('clerk sign-in')
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.search).toEqual({ redirect: '/export?x=1' })
    expect(signIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ forceRedirectUrl: '/export?x=1' }),
    )
  })

  it('waits for Clerk before deciding', async () => {
    session.isLoaded = false
    const router = renderAt('/export')
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument(),
    )
    expect(router.state.location.pathname).toBe('/export')
    expect(screen.queryByText('clerk sign-in')).not.toBeInTheDocument()
  })

  it('never redirects to another site after signing in', async () => {
    renderAt('/sign-in?redirect=https%3A%2F%2Fevil.example')
    await screen.findByText('clerk sign-in')
    expect(signIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ forceRedirectUrl: '/' }),
    )
  })

  it('keeps the way back when a Clerk step reloads without it', async () => {
    sessionStorage.removeItem('ae-sign-in-redirect')
    const first = renderAt('/sign-in?redirect=%2Fexport')
    await screen.findByText('clerk sign-in')
    first.history.destroy?.()
    document.body.innerHTML = ''
    renderAt('/sign-in/factor-one')
    await screen.findByText('clerk sign-in')
    expect(signIn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        forceRedirectUrl: '/export',
        transferable: false,
      }),
    )
  })

  it('forgets an abandoned way back on a fresh sign-in', async () => {
    sessionStorage.setItem('ae-sign-in-redirect', '/export')
    renderAt('/sign-in')
    await screen.findByText('clerk sign-in')
    expect(signIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ forceRedirectUrl: '/' }),
    )
    expect(sessionStorage.getItem('ae-sign-in-redirect')).toBeNull()
  })

  it('follows a new way back when sign-in is entered again in place', async () => {
    sessionStorage.setItem('ae-sign-in-redirect', '/export')
    const router = renderAt('/sign-in/sso-callback')
    await screen.findByText('clerk sign-in')
    expect(signIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ forceRedirectUrl: '/export' }),
    )
    await router.navigate({
      to: '/sign-in/$',
      params: { _splat: '' },
      search: { redirect: '/profile' },
    } as never)
    await waitFor(() =>
      expect(signIn).toHaveBeenLastCalledWith(
        expect.objectContaining({ forceRedirectUrl: '/profile' }),
      ),
    )
    await waitFor(() =>
      expect(sessionStorage.getItem('ae-sign-in-redirect')).toBe('/profile'),
    )
    await router.navigate({
      to: '/sign-in/$',
      params: { _splat: '' },
    } as never)
    await waitFor(() =>
      expect(signIn).toHaveBeenLastCalledWith(
        expect.objectContaining({ forceRedirectUrl: '/' }),
      ),
    )
    await waitFor(() =>
      expect(sessionStorage.getItem('ae-sign-in-redirect')).toBeNull(),
    )
  })

  it('keeps the way back across steps when storage is blocked', async () => {
    const fail = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('sessionStorage', {
      getItem: fail,
      setItem: fail,
      removeItem: fail,
    })
    const router = renderAt('/sign-in?redirect=%2Fexport')
    await screen.findByText('clerk sign-in')
    await router.navigate({
      to: '/sign-in/$',
      params: { _splat: 'factor-one' },
    } as never)
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/sign-in/factor-one'),
    )
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(signIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ forceRedirectUrl: '/export' }),
    )
  })

  it('forwards once to the stored way back, whatever renders next', async () => {
    sessionStorage.setItem('ae-sign-in-redirect', '/export')
    session.isSignedIn = true
    sessionStorage.setItem('portal-fake', 'new')
    const router = renderAt('/sign-in/factor-one')
    await waitFor(() => expect(router.state.location.pathname).toBe('/export'))
    expect(sessionStorage.getItem('ae-sign-in-redirect')).toBeNull()
    const calls = signIn.mock.calls.map(
      ([props]) => (props as { forceRedirectUrl: string }).forceRedirectUrl,
    )
    expect(calls.every((url) => url === '/export')).toBe(true)
  })

  it('sends a signed-in visitor home when the way back is sign-in itself', async () => {
    session.isSignedIn = true
    sessionStorage.setItem('portal-fake', 'new')
    const router = renderAt('/sign-in?redirect=%2FSign-In')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('sends a signed-in visitor home past a malformed sign-in way back', async () => {
    session.isSignedIn = true
    sessionStorage.setItem('portal-fake', 'new')
    const router = renderAt('/sign-in?redirect=%2F%2573ign-in%2F%254%2531')
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('sends a signed-in visitor on from sign-in', async () => {
    session.isSignedIn = true
    sessionStorage.setItem('portal-fake', 'new')
    const router = renderAt('/sign-in?redirect=%2Fexport')
    await waitFor(() => expect(router.state.location.pathname).toBe('/export'))
    expect(
      await screen.findByRole('heading', { name: 'Je gegevens downloaden' }),
    ).toBeInTheDocument()
  })

  it('shows the profile under its Dutch and English paths', async () => {
    session.isSignedIn = true
    renderAt('/profiel')
    expect(
      await screen.findByText('clerk profile at /profiel'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Profiel', level: 1 }),
    ).toBeInTheDocument()
  })

  it('shows the English profile', async () => {
    session.isSignedIn = true
    renderAt('/profile', 'en')
    expect(
      await screen.findByText('clerk profile at /profile'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Profile', level: 1 }),
    ).toBeInTheDocument()
  })

  it('offers NL | EN on sign-in', async () => {
    const setLocale = vi.fn()
    renderAt('/sign-in', 'nl', setLocale)
    await screen.findByText('clerk sign-in')
    expect(screen.getByRole('button', { name: 'NL' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    screen.getByRole('button', { name: 'EN' }).click()
    expect(setLocale).toHaveBeenCalledWith('en')
  })

  it.each([
    ['nl', 'Deze pagina bestaat niet', 'Naar het overzicht'],
    ['en', 'This page does not exist', 'Go to the overview'],
  ] as const)(
    'renders a %s 404 for unknown paths',
    async (locale, title, cta) => {
      renderAt('/nope', locale)
      expect(
        await screen.findByRole('heading', { name: title }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: cta })).toHaveAttribute(
        'href',
        '/',
      )
    },
  )
})
