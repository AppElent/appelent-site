// A stand-in for the Workers static assets binding with html_handling
// "auto-trailing-slash": /privacy → privacy.html, /en/ → en/index.html.

export function fakeAssets(files: Record<string, string>): Fetcher {
  const lookup = (path: string) =>
    path.endsWith('/')
      ? `${path.slice(1)}index.html`
      : path.slice(1).includes('.')
        ? path.slice(1)
        : `${path.slice(1)}.html`
  return {
    fetch: async (input: RequestInfo | URL) => {
      const request =
        input instanceof Request ? input : new Request(String(input))
      const path = new URL(request.url).pathname
      if (path === '/en') {
        return new Response(null, {
          status: 307,
          headers: { Location: '/en/' },
        })
      }
      const body = files[lookup(path)]
      if (body === undefined) return new Response('not found', { status: 404 })
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: {
          'Content-Type': path.endsWith('.css') ? 'text/css' : 'text/html',
          ETag: '"x"',
        },
      })
    },
    connect: () => {
      throw new Error('not used')
    },
  } as unknown as Fetcher
}
