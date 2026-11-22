import { ConvexError } from 'convex/values'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const query = vi.fn()
const setAuth = vi.fn()
const options = vi.hoisted(() => ({ last: null as unknown }))
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    query = query
    setAuth = setAuth
    constructor(_url: string, opts: unknown) {
      options.last = opts
    }
  },
}))

const {
  createConvexPortalClient,
  markTokenRejected,
  ownTokens,
  TokenRejected,
  tokenSubject,
} = await import('../src/portal/convex-client.ts')

const jwtFor = (sub: string) =>
  `h.${btoa(JSON.stringify({ sub })).replace(/=+$/, '')}.s`

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

  it.each([
    ['Foundry', new ConvexError({ code: 'unauthenticated' })],
    ['Gather', new ConvexError('Not authenticated')],
    ['Convex (401)', new TokenRejected('{"code":"InvalidAuthHeader"}')],
  ])(
    'asks Clerk for a fresh token once when %s says not signed in',
    async (_app, refusal) => {
      query
        .mockRejectedValueOnce(refusal)
        .mockResolvedValue({ contract: 1, lastActiveAt: null, counts: [] })
      const tokens: (boolean | undefined)[] = []
      const client = createConvexPortalClient(
        'gather',
        'https://x.convex.cloud',
        async (fresh) => {
          tokens.push(fresh)
          return fresh ? 'fresh-jwt' : 'cached-jwt'
        },
      )
      await expect(client.summary()).resolves.not.toBeNull()
      expect(tokens).toEqual([false, true])
      expect(setAuth).toHaveBeenLastCalledWith('fresh-jwt')
    },
  )

  it('gives up after one refusal with a fresh token, and never retries other errors', async () => {
    query.mockRejectedValue(new ConvexError({ code: 'unauthenticated' }))
    let calls = 0
    const client = createConvexPortalClient(
      'foundry',
      'https://x.convex.cloud',
      async () => {
        calls++
        return 'jwt'
      },
    )
    await expect(client.summary()).rejects.toBeInstanceOf(ConvexError)
    expect(calls).toBe(2)

    query.mockReset()
    query.mockRejectedValue(new Error('Server error'))
    calls = 0
    await expect(client.summary()).rejects.toThrow('Server error')
    expect(calls).toBe(1)
  })

  it.each([
    ['the fresh token arrives', 'token'],
    ['the refusal arrives', 'refusal'],
  ])(
    'starts no retry once the deadline passed before %s',
    async (_case, late) => {
      vi.useFakeTimers()
      try {
        let refuse: (error: unknown) => void = () => {}
        let give: (token: string) => void = () => {}
        query.mockImplementationOnce(
          () =>
            new Promise((_resolve, reject) => {
              refuse = reject
            }),
        )
        const tokens: (boolean | undefined)[] = []
        const client = createConvexPortalClient(
          'foundry',
          'https://x.convex.cloud',
          (fresh) => {
            tokens.push(fresh)
            if (!fresh) return Promise.resolve('cached-jwt')
            return new Promise<string>((resolve) => {
              give = resolve
            })
          },
        )
        const result = expect(client.summary()).rejects.toThrow('Timed out')
        await vi.advanceTimersByTimeAsync(0)
        if (late === 'token') {
          refuse(new ConvexError({ code: 'unauthenticated' }))
          await vi.advanceTimersByTimeAsync(20_000)
          await result
          give('fresh-jwt')
        } else {
          await vi.advanceTimersByTimeAsync(20_000)
          await result
          refuse(new ConvexError({ code: 'unauthenticated' }))
        }
        await vi.advanceTimersByTimeAsync(0)
        expect(query).toHaveBeenCalledTimes(1)
        expect(setAuth).toHaveBeenCalledTimes(1)
        expect(tokens).toEqual(late === 'token' ? [false, true] : [false])
      } finally {
        vi.useRealTimers()
      }
    },
  )

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

  it('gives the SDK a fetch that marks a 401 as a rejected token', async () => {
    createConvexPortalClient(
      'gather',
      'https://x.convex.cloud',
      async () => 'jwt',
    )
    expect((options.last as { fetch?: unknown }).fetch).toBe(markTokenRejected)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('{"code":"Expired"}', { status: 401 }),
        )
        .mockResolvedValueOnce({
          status: 401,
          text: () => Promise.reject(new Error('connection reset')),
        })
        .mockResolvedValueOnce(new Response('{}', { status: 200 })),
    )
    try {
      await expect(markTokenRejected('https://x')).rejects.toBeInstanceOf(
        TokenRejected,
      )
      await expect(markTokenRejected('https://x')).rejects.toBeInstanceOf(
        TokenRejected,
      )
      await expect(markTokenRejected('https://x')).resolves.toHaveProperty(
        'status',
        200,
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('reads the subject of a token, and nothing from a malformed one', () => {
    expect(tokenSubject(jwtFor('user_a'))).toBe('user_a')
    expect(tokenSubject('not-a-jwt')).toBeNull()
    expect(tokenSubject('h.%%%.s')).toBeNull()
    expect(tokenSubject(null)).toBeNull()
  })

  it("never sends another account's token, also on the fresh-token retry", async () => {
    let active = 'user_a'
    const source = ownTokens('user_a', async () => jwtFor(active))
    query.mockRejectedValueOnce(new ConvexError('Not authenticated'))
    query.mockResolvedValue({
      contract: 1,
      app: 'gather',
      tables: {},
      next: null,
    })
    const client = createConvexPortalClient(
      'gather',
      'https://x.convex.cloud',
      async (fresh) => {
        // Account B becomes active before the refusal comes back.
        if (fresh) active = 'user_b'
        return source(fresh)
      },
    )
    await expect(client.exportPage('cursor-a')).rejects.toThrow(
      'No Clerk session token',
    )
    expect(query).toHaveBeenCalledTimes(1)
    expect(setAuth).toHaveBeenCalledTimes(1)
    expect(setAuth).toHaveBeenCalledWith(jwtFor('user_a'))
    await expect(
      ownTokens(null, async () => jwtFor('user_a'))(),
    ).resolves.toBeNull()
  })
})
