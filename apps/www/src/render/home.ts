import { appStoreUrl, apps } from '../content/apps.ts'
import { owner, pending } from '../content/owner.ts'
import { fmt } from '../i18n/index.ts'
import { accountUrl } from '../routes.ts'
import { type Html, html, placeholderComment } from './html.ts'
import { appleGlyph, arrowIcon } from './icons.ts'
import { document, emailLink, type PageContext } from './layout.ts'

const stack = [
  'TanStack Start',
  'Convex',
  'Expo',
  'Clerk',
  'Cloudflare Workers',
  'Claude Code',
  'Linear',
]

export function homePage(ctx: PageContext): string {
  const { copy } = ctx
  return document(ctx, {
    page: 'home',
    title: copy.meta.homeTitle,
    description: copy.meta.homeDescription,
    main: html`${hero(ctx)}
${appCards(ctx)}
${accountBand(ctx)}
${stackSection(ctx)}
${contact(ctx)}`,
  })
}

function hero(ctx: PageContext): Html {
  const { copy, assets } = ctx
  const t = copy.home.hero
  return html`<section class="hero" aria-labelledby="hero-title">
<div class="hero-text">
<p class="eyebrow eyebrow-teal"><span class="dot" aria-hidden="true"></span>${t.eyebrow}</p>
<h1 id="hero-title" class="display-1">${t.title}</h1>
<p class="hero-lead">${t.body}</p>
<div class="actions">
<a class="btn btn-chalk" href="#apps">${t.cta}</a>
<a class="btn btn-outline-chalk" href="#contact">${t.contact}</a>
</div>
</div>
<div class="hero-icons" aria-hidden="true">
${apps.map((app) => html`<img src="${assets.appIcons[app.id]}" alt="" width="112" height="112">`)}
</div>
</section>`
}

function appCards(ctx: PageContext): Html {
  const { copy, assets, locale } = ctx
  const t = copy.home.apps
  return html`<section id="apps" class="section" aria-labelledby="apps-title">
<div class="section-head">
<h2 id="apps-title" class="display-2">${t.title}</h2>
<p class="muted measure">${t.body}</p>
</div>
<div class="grid-apps">
${apps.map((app) => {
  const store =
    app.appStore === 'live'
      ? html`<a class="store-badge" href="${appStoreUrl(app)}"><img src="${assets.badges[locale]}" alt="${fmt(t.storeAlt, { app: app.name })}" width="144" height="48"></a>`
      : html`<span class="store-soon">${appleGlyph}<span class="store-soon-text"><span class="store-soon-small">${t.soonSmall}</span><span class="store-soon-big">${t.soon}</span></span></span>`
  return html`<article class="card app-card">
<div class="app-head">
<img class="app-icon" src="${assets.appIcons[app.id]}" alt="" width="64" height="64">
<div>
<p class="eyebrow muted">${copy.apps[app.id].kind}</p>
<h3 class="app-name">${app.name}</h3>
</div>
</div>
<p class="muted">${copy.apps[app.id].body}</p>
<div class="app-actions">
${pending.launchStatus ? placeholderComment('item 2', `App Store status of ${app.name} (${app.appStore}); confirm in content/apps.ts`) : ''}${store}
<a class="btn btn-outline" href="${app.web}">${t.openWeb}<span class="sr-only">: ${app.name}</span>${arrowIcon}</a>
</div>
</article>`
})}
</div>
</section>`
}

function accountBand(ctx: PageContext): Html {
  const t = ctx.copy.home.account
  return html`<section class="band band-teal" aria-labelledby="account-title">
<div class="band-text">
<h2 id="account-title" class="display-3">${t.title}</h2>
<p class="ink-soft measure">${t.body}</p>
</div>
<a class="btn btn-action" href="${accountUrl}">${t.cta}</a>
</section>`
}

function stackSection(ctx: PageContext): Html {
  const t = ctx.copy.home.stack
  return html`<section class="section section-tight" aria-labelledby="stack-title">
<h2 id="stack-title" class="display-3">${t.title}</h2>
<p class="muted measure">${t.body}</p>
<ul class="pills">
${stack.map((item) => html`<li>${item}</li>`)}
</ul>
</section>`
}

function contact(ctx: PageContext): Html {
  const t = ctx.copy.home.contact
  return html`<section id="contact" class="band band-slate" aria-labelledby="contact-title">
<div class="band-text">
<h2 id="contact-title" class="display-2">${t.title}</h2>
<p class="on-slate-soft measure">${t.body}</p>
</div>
<div class="actions">
${emailLink(t.mail, 'btn btn-chalk')}
<a class="btn btn-outline-chalk" href="${owner.github}">${t.github}</a>
</div>
</section>`
}
