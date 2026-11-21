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
${does(ctx)}
${appCards(ctx)}
${accountBand(ctx)}
${stackSection(ctx)}
${contact(ctx)}`,
  })
}

function hero(ctx: PageContext): Html {
  const { copy, assets } = ctx
  const t = copy.home.hero
  const photo = assets.photo
    ? html`<img class="hero-photo" src="${assets.photo}" alt="${t.photoAlt}" width="96" height="96">`
    : html`${placeholderComment('item 1', 'square photo of Eric, ≥400px; set owner.photo')}<div class="hero-photo hero-photo-ph" role="img" aria-label="${t.photoLabel}">EJ<span>${t.photoHint}</span></div>`

  return html`<section class="hero" aria-labelledby="hero-title">
<div class="hero-text" id="about">
<div class="hero-id">
${photo}
<p class="hero-name"><span class="hero-person">${owner.name}</span><span class="eyebrow eyebrow-teal"><span class="dot" aria-hidden="true"></span>${t.eyebrow}</span></p>
</div>
<h1 id="hero-title" class="display-1">${t.title}</h1>
${pending.bio ? placeholderComment('item 2', 'one or two bio sentences, catalog home.hero.body (nl + en)') : ''}<p class="hero-lead${pending.bio ? ' ph' : ''}">${t.body}</p>
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

function does(ctx: PageContext): Html {
  const t = ctx.copy.home.does
  const cards = [
    { ...t.apps, placeholder: false },
    { ...t.factory, placeholder: false },
    { ...t.work, placeholder: pending.workCard },
  ]
  return html`<section class="section" aria-labelledby="do-title">
<h2 id="do-title" class="display-2">${t.title}</h2>
<div class="grid-do">
${cards.map(
  (
    card,
  ) => html`${card.placeholder ? placeholderComment('item 3', 'Eric’s work card, catalog home.does.work (nl + en)') : ''}<article class="card do-card${card.placeholder ? ' ph-card' : ''}">
<span class="do-icon" aria-hidden="true"><span class="dot"></span></span>
<h3 class="card-title">${card.title}</h3>
<p class="muted">${card.body}</p>
</article>`,
)}
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
${pending.launchStatus ? placeholderComment('item 5', `App Store status of ${app.name} (${app.appStore}); confirm in content/apps.ts`) : ''}${store}
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
  let linkedin: Html | string = ''
  if (owner.linkedin) {
    linkedin = html`<a class="btn btn-outline-chalk" href="${owner.linkedin}">${t.linkedin}</a>`
  } else if (pending.links) {
    linkedin = html`${placeholderComment('item 4', 'LinkedIn or other links; set owner.linkedin or drop')}<span class="btn btn-placeholder">${t.linkedinPlaceholder}</span>`
  }
  return html`<section id="contact" class="band band-slate" aria-labelledby="contact-title">
<div class="band-text">
<h2 id="contact-title" class="display-2">${t.title}</h2>
<p class="on-slate-soft measure">${t.body}</p>
</div>
<div class="actions">
${emailLink(t.mail, 'btn btn-chalk')}
<a class="btn btn-outline-chalk" href="${owner.github}">${t.github}</a>
${linkedin}
</div>
</section>`
}
