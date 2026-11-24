import { describe, expect, it } from 'vitest'
import { apps } from '../src/content/apps.ts'
import { owner, pending } from '../src/content/owner.ts'
import { type Locale, locales, messages } from '../src/i18n/index.ts'
import { homePage } from '../src/render/home.ts'
import { type AssetUrls, context } from '../src/render/layout.ts'
import { notFoundPage, privacyPage, supportPage } from '../src/render/pages.ts'
import { pagePaths, statusUrl } from '../src/routes.ts'

const assets: AssetUrls = {
  css: '/assets/styles.css',
  mark: '/assets/mark.svg',
  fonts: { text: '/assets/inter.woff2', display: '/assets/bricolage.woff2' },
  appIcons: {
    gather: '/assets/g.png',
    foundry: '/assets/f.png',
    fairway: '/assets/w.png',
    arcade: '/assets/a.png',
  },
  badges: { nl: '/assets/badge-nl.svg', en: '/assets/badge-en.svg' },
}

const pages = {
  home: homePage,
  privacy: privacyPage,
  support: supportPage,
}

function render(page: keyof typeof pages, locale: Locale): string {
  return pages[page](context(locale, assets))
}

function hrefs(htmlText: string): string[] {
  return [...htmlText.matchAll(/href="([^"]*)"/g)].map((m) => m[1] ?? '')
}

describe.each(locales)('%s pages', (locale) => {
  const copy = messages[locale]

  it.each(Object.keys(pages) as (keyof typeof pages)[])(
    '%s has lang, canonical and hreflang alternates',
    (page) => {
      const out = render(page, locale)
      expect(out).toContain(`<html lang="${locale}">`)
      expect(out).toContain(
        `<link rel="canonical" href="https://appelent.nl${pagePaths[page][locale]}">`,
      )
      for (const l of locales) {
        expect(out).toContain(
          `<link rel="alternate" hreflang="${l}" href="https://appelent.nl${pagePaths[page][l]}">`,
        )
      }
      expect(out).toContain('hreflang="x-default"')
    },
  )

  it.each(Object.keys(pages) as (keyof typeof pages)[])(
    '%s links only to real places',
    (page) => {
      const known = new Set([
        ...Object.values(pagePaths).flatMap((p) => Object.values(p)),
        ...Object.values(pagePaths).flatMap((p) =>
          locales.map((l) => `${p[l]}?lang=${l}`),
        ),
        `${pagePaths.home[locale]}#apps`,
      ])
      for (const href of hrefs(render(page, locale))) {
        if (href === '#') throw new Error(`dead link on ${page}`)
        if (
          /^(https:|mailto:|#[a-z])/.test(href) ||
          href.startsWith('/assets/') ||
          href.startsWith('/favicon') ||
          href === '/apple-touch-icon.png'
        )
          continue
        expect(known, `${page}: ${href}`).toContain(href)
      }
    },
  )

  it('marks the language switch and current page', () => {
    const out = render('privacy', locale)
    expect(out).toMatch(
      new RegExp(
        `lang="${locale}" hreflang="${locale}" title="[^"]+" aria-current="true"`,
      ),
    )
    expect(out).toContain(
      `href="${pagePaths.privacy[locale]}" aria-current="page"`,
    )
  })

  it('renders the home sections in design order', () => {
    const out = render('home', locale)
    const order = [
      'hero-title',
      'id="apps"',
      'account-title',
      'stack-title',
      'id="contact"',
    ]
    const positions = order.map((marker) => out.indexOf(marker))
    expect(positions.every((p) => p > 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('shows the App Store badge or the coming-soon state, never a dead store link', () => {
    const out = render('home', locale)
    for (const app of apps) {
      const storeLink = `https://apps.apple.com/app/id${app.appStoreId}`
      if (app.appStore === 'live') {
        expect(out).toContain(
          `href="${storeLink}"><img src="${assets.badges[locale]}"`,
        )
      } else {
        expect(out).not.toContain(storeLink)
      }
    }
    expect(out.split('class="store-soon"').length - 1).toBe(
      apps.filter((a) => a.appStore === 'soon').length,
    )
    expect(out).toContain(copy.home.apps.soon)
  })

  it('keeps the hero icon grid decorative', () => {
    expect(render('home', locale)).toMatch(
      /<div class="hero-icons" aria-hidden="true">\n(<img src="[^"]+" alt="" [^>]+>){4}/,
    )
  })

  it('anchors every app in the privacy policy, with numbered sections', () => {
    const out = render('privacy', locale)
    for (const app of apps) expect(out).toContain(`<li id="app-${app.id}">`)
    const sections = Object.values(copy.privacy.sections)
    expect(sections).toHaveLength(6)
    sections.forEach((s, i) => {
      expect(out).toContain(`<a href="#${s.anchor}">${i + 1}. ${s.title}</a>`)
      expect(out).toContain(`<section id="${s.anchor}"`)
    })
    expect(out).not.toContain('{email}')
    expect(out).toContain(owner.email)
  })

  it('gives the support page a mail button and three questions', () => {
    const out = render('support', locale)
    expect(out).toContain(`href="mailto:${owner.email}"`)
    expect(out.split('class="faq-item"').length - 1).toBe(3)
    expect(out).toContain(
      `<a href="${statusUrl}">${copy.support.statusLink}</a>`,
    )
  })

  it('links the status page from the footer', () => {
    const out = render('home', locale)
    const footer = out.slice(out.indexOf('<footer'))
    expect(footer).toContain(
      `<a href="${statusUrl}">${copy.shell.footStatus}</a>`,
    )
  })

  it('renders the 404 page without alternates and noindex', () => {
    const out = notFoundPage(context(locale, assets))
    expect(out).toContain(`<html lang="${locale}">`)
    expect(out).toContain('<meta name="robots" content="noindex">')
    expect(out).not.toContain('rel="alternate"')
    expect(out).toContain(
      `class="btn btn-action" href="${pagePaths.home[locale]}"`,
    )
    expect(out).toContain(copy.notFound.title)
  })

  it('escapes catalog text', () => {
    expect(render('home', locale)).not.toMatch(/<script/i)
  })
})

describe('placeholders', () => {
  const home = render('home', 'nl')

  it('marks every open item with a comment and dashed styling', () => {
    if (pending.email)
      expect(home).toMatch(
        /PLACEHOLDER \(item 1\)[\s\S]*class="btn btn-chalk ph"/,
      )
    if (pending.launchStatus) expect(home).toContain('PLACEHOLDER (item 2)')
    if (pending.privacy)
      expect(render('privacy', 'en')).toContain('class="draft-note"')
  })

  it('carries no personal info on the home page', () => {
    for (const locale of locales) {
      const out = render('home', locale).replace(/<!--[\s\S]*?-->/g, '')
      expect(out).not.toContain('Eric')
      expect(out).not.toContain('#about')
      expect(out).not.toContain('linkedin')
    }
  })
})
