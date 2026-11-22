import { beforeEach, describe, expect, it, vi } from 'vitest'

const query = vi.fn()
const setAuth = vi.fn()
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    query = query
    setAuth = setAuth
  },
}))

const { createConvexPortalClient } = await import(
  '../src/portal/convex-client.ts'
)

describe('createConvexPortalClient', () => {
  beforeEach(() => {
    query.mockReset()
    setAuth.mockReset()
  })

  it('signs every call in with the convex token and checks the answer', async () => {
    query.mockResolvedValue({ contract: 1, lastActiveAt: null, counts: [] })
    const client = createConvexPortalClient(
      'gather',
      'https://x.convex.cloud',
      async () => 'jwt',
    )
    await expect(client.summary()).resolves.toEqual({
      contract: 1,
      lastActiveAt: null,
      counts: [],
    })
    expect(setAuth).toHaveBeenCalledWith('jwt')
    expect(query).toHaveBeenCalledWith(expect.anything(), {})
  })

  it('never calls an app without a token', async () => {
    const client = createConvexPortalClient(
      'gather',
      'https://x.convex.cloud',
      async () => null,
    )
    await expect(client.summary()).rejects.toThrow('No Clerk session token')
    expect(query).not.toHaveBeenCalled()
  })

  it('passes the cursor and rejects pages for another app', async () => {
    query.mockResolvedValue({
      contract: 1,
      app: 'foundry',
      tables: {},
      next: null,
    })
    const client = createConvexPortalClient(
      'gather',
      'https://x.convex.cloud',
      async () => 'jwt',
    )
    await expect(client.exportPage('c1')).rejects.toThrow('another app')
    expect(query).toHaveBeenCalledWith(expect.anything(), { cursor: 'c1' })
  })

  it('times out a token that never comes, and never calls late', async () => {
    vi.useFakeTimers()
    try {
      let give: (token: string) => void = () => {}
      const client = createConvexPortalClient(
        'gather',
        'https://x.convex.cloud',
        () =>
          new Promise<string>((resolve) => {
            give = resolve
          }),
      )
      const result = expect(client.summary()).rejects.toThrow('Timed out')
      await vi.advanceTimersByTimeAsync(20_000)
      await result
      give('late-jwt')
      await vi.advanceTimersByTimeAsync(0)
      expect(setAuth).not.toHaveBeenCalled()
      expect(query).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('surfaces a missing accountPortal function as an error', async () => {
    query.mockRejectedValue(
      new Error("Could not find public function for 'accountPortal:summary'"),
    )
    const client = createConvexPortalClient(
      'gather',
      'https://x.convex.cloud',
      async () => 'jwt',
    )
    await expect(client.summary()).rejects.toThrow('Could not find')
  })
})
