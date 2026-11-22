import { createRouter } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { routeTree } from './routeTree.gen'

// A fresh CSP nonce per server render; TanStack Start puts it on every script
// it emits, and the root route sends the matching header.
const ssrOptions = createIsomorphicFn().server(() => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return { nonce: btoa(String.fromCharCode(...bytes)) }
})

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    ssr: ssrOptions(),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
