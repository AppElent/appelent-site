import { apps } from '../content/apps.ts'
import { owner, pending } from '../content/owner.ts'
import { type Locale, locales, type Messages, messages } from '../i18n/index.ts'
import {
  accountUrl,
  origin,
  type PageId,
  pagePaths,
  switchHref,
} from '../routes.ts'
import { type Html, html, placeholderComment } from './html.ts'

/** Fingerprinted asset URLs, filled in by the build. */
export interface AssetUrls {
  css: string
  mark: string
  fonts: { text: string; display: string }
  appIcons: Record<(typeof apps)[number]['id'], string>
  badges: Record<Locale, string>
  /** Eric's photo, once supplied (`owner.photo`). */
  photo: string | null
}

export interface PageContext {
  locale: Locale
  copy: Messages
  assets: AssetUrls
}

export function context(locale: Locale, assets: AssetUrls): PageContext {
  return { locale, copy: messages[locale], assets }
}

interface DocumentOptions {
  /** The page, or null for the 404 page (no alternates, noindex). */
  page: PageId | null
  title: string
  description: string
  main: Html
}

const themeColors = { light: '#f6f7fb', dark: '#12161f' }

export function document(ctx: PageContext, options: DocumentOptions): string {
  const { locale, copy, assets } = ctx
  const { page } = options
  const self = page ? origin + pagePaths[page][locale] : null
  const xDefault = page
    ? origin + (page === 'home' ? pagePaths.home.nl : pagePaths[page].en)
    : null

  const head = html`<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${options.title}</title>
<meta name="description" content="${options.description}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${themeColors.light}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${themeColors.dark}">
${
  page
    ? html`<link rel="canonical" href="${self}">
${locales.map((l) => html`<link rel="alternate" hreflang="${l}" href="${origin + pagePaths[page][l]}">\n`)}<link rel="alternate" hreflang="x-default" href="${xDefault}">`
    : html`<meta name="robots" content="noindex">`
}
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="${assets.fonts.display}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${assets.fonts.text}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${copy.meta.siteName}">
<meta property="og:title" content="${options.title}">
<meta property="og:description" content="${options.description}">
${self ? html`<meta property="og:url" content="${self}">` : ''}
<meta property="og:locale" content="${copy.meta.ogLocale}">
<meta property="og:image" content="${origin}/icon-512.png">`

  return `<!doctype html>
<html lang="${locale}">
<head>
${head.__html}
</head>
<body>
${header(ctx, page).__html}
<main id="main" class="wrap main">
${options.main.__html}
</main>
${footer(ctx).__html}
</body>
</html>
`
}

function header(ctx: PageContext, page: PageId | null): Html {
  const { locale, copy, assets } = ctx
  const home = pagePaths.home[locale]
  const navColor = (target: PageId) => (page === target ? 'is-current' : '')
  const current = (target: PageId) =>
    page === target && target !== 'home' ? html` aria-current="page"` : ''
  // The 404 page has no counterpart, so its switch goes to each home page.
  const switchTarget = (l: Locale) => pagePaths[page ?? 'home'][l]

  return html`<a class="skip" href="#main">${copy.shell.skip}</a>
<header class="wrap site-header">
<a class="brand" href="${home}" aria-label="${copy.shell.homeLabel}"><img src="${assets.mark}" alt="" width="32" height="32"><span>AppElent</span></a>
<nav class="main-nav" aria-label="${copy.shell.navLabel}">
<a class="${navColor('home')}" href="${home}#about">${copy.shell.navAbout}</a>
<a class="${navColor('home')}" href="${home}#apps">${copy.shell.navApps}</a>
<a class="${navColor('privacy')}" href="${pagePaths.privacy[locale]}"${current('privacy')}>${copy.shell.navPrivacy}</a>
<a class="${navColor('support')}" href="${pagePaths.support[locale]}"${current('support')}>${copy.shell.navSupport}</a>
</nav>
<nav class="lang-switch" aria-label="${copy.shell.langLabel}">
${locales.map(
  (l) =>
    html`<a href="${switchHref(switchTarget(l), l)}" lang="${l}" hreflang="${l}" title="${copy.shell.languageNames[l]}"${l === locale ? html` aria-current="true"` : ''}>${copy.shell.languages[l]}</a>`,
)}
</nav>
</header>`
}

function footer(ctx: PageContext): Html {
  const { locale, copy, assets } = ctx
  return html`<footer class="site-footer">
<div class="wrap footer-grid">
<div class="footer-brand">
<span class="brand-static"><img src="${assets.mark}" alt="" width="28" height="28">AppElent</span>
<span class="muted">${copy.shell.footTag}</span>
</div>
<nav aria-label="${copy.shell.footApps}" class="footer-col">
<span class="footer-title">${copy.shell.footApps}</span>
${apps.map((app) => html`<a href="${app.web}">${app.name}</a>`)}
</nav>
<nav aria-label="${copy.shell.footAppElent}" class="footer-col">
<span class="footer-title">${copy.shell.footAppElent}</span>
<a href="${pagePaths.privacy[locale]}">${copy.shell.navPrivacy}</a>
<a href="${pagePaths.support[locale]}">${copy.shell.navSupport}</a>
<a href="${accountUrl}">${copy.shell.footAccount}</a>
</nav>
<div class="footer-col">
<span class="footer-title">${copy.shell.footContact}</span>
${emailLink(owner.email, '')}
<span class="muted">${copy.shell.copyright}</span>
</div>
</div>
</footer>`
}

/** A mailto link to the site's contact address, marked while Eric has not confirmed it. */
export function emailLink(
  label: string,
  className: string,
  extra: Html | string = '',
): Html {
  const classes = [className, pending.email ? 'ph' : ''].filter(Boolean)
  return html`${pending.email ? placeholderComment('item 4', 'contact email, confirm with Eric') : ''}<a href="mailto:${owner.email}"${classes.length ? html` class="${classes.join(' ')}"` : ''}>${label}${extra}</a>`
}
