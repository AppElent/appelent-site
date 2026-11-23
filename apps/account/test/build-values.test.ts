// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { convexUrlProblems, versionJson } from '../scripts/lib/build-values.ts'

const good = {
  VITE_GATHER_CONVEX_URL:
    'https://limitless-bulldog-972.eu-west-1.convex.cloud',
  VITE_FOUNDRY_CONVEX_URL: 'https://fine-akita-444.eu-west-1.convex.cloud',
  VITE_FAIRWAY_CONVEX_URL: 'https://giddy-pelican-141.eu-west-1.convex.cloud',
  VITE_ARCADE_CONVEX_URL: 'https://chatty-ram-217.convex.cloud',
}

describe('convexUrlProblems', () => {
  it('accepts deployment origins, and no URLs at all (CI)', () => {
    expect(convexUrlProblems(good)).toEqual([])
    expect(convexUrlProblems({})).toEqual([])
  })

  it.each([
    'http://fine-akita-444.eu-west-1.convex.cloud',
    'https://fine-akita-444.eu-west-1.convex.cloud/',
    'https://fine-akita-444.eu-west-1.convex.site',
    'https://evil.example/fine-akita-444.convex.cloud',
    'fine-akita-444',
  ])('refuses %s', (url) => {
    expect(
      convexUrlProblems({ ...good, VITE_FOUNDRY_CONVEX_URL: url }),
    ).toEqual([expect.stringContaining('VITE_FOUNDRY_CONVEX_URL')])
  })

  it('refuses two apps on one deployment', () => {
    expect(
      convexUrlProblems({
        ...good,
        VITE_ARCADE_CONVEX_URL: good.VITE_GATHER_CONVEX_URL,
      }),
    ).toEqual(['Two apps share one Convex URL'])
  })
})

describe('versionJson', () => {
  it('records the commit, or "local"', () => {
    expect(JSON.parse(versionJson({ GITHUB_SHA: 'abc' }))).toEqual({
      commit: 'abc',
    })
    expect(JSON.parse(versionJson({}))).toEqual({ commit: 'local' })
  })
})
