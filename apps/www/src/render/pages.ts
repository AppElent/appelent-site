import { apps } from '../content/apps.ts'
import { owner, pending } from '../content/owner.ts'
import type { PolicySection } from '../i18n/en.ts'
import { fmt } from '../i18n/index.ts'
import { pagePaths } from '../routes.ts'
import { type Html, html, placeholderComment } from './html.ts'
import { document, emailLink, type PageContext } from './layout.ts'

const withEmail = (text: string) => fmt(text, { email: owner.email })

function paragraphs(body: Record<string, string> | undefined): Html[] {
  return Object.values(body ?? {}).map(
    (text) => html`<p class="muted">${withEmail(text)}</p>`,
  )
}

export function privacyPage(ctx: PageContext): string {
  const { copy, assets } = ctx
  const t = copy.privacy
  const sections: [string, PolicySection][] = Object.entries(t.sections)

  const perAppRows = html`<ul class="app-rows">
${apps.map(
  (app) => html`<li id="app-${app.id}">
<img class="app-icon" src="${assets.appIcons[app.id]}" alt="" width="40" height="40">
<div class="app-row-text">
<h3 class="app-row-name">${app.name}</h3>
<p class="small muted">${copy.apps[app.id].stores}</p>
${Object.values(copy.apps[app.id].notes).map((note) => html`<p class="small muted">${note}</p>`)}
</div>
</li>`,
)}
</ul>`

  const main = html`<div class="page-head">
<h1 class="display-2">${t.title}</h1>
<p class="lead muted">${t.lead}</p>
<p class="page-meta"><span class="pill-teal">${t.scope}</span>${pending.privacy ? placeholderComment('item 6', 'final privacy text and date, Eric approves in the PR') : ''}<span${pending.privacy ? html` class="ph"` : ''}>${t.updated}</span></p>
</div>
<div class="policy">
<nav class="toc" aria-label="${t.tocLabel}">
<p class="toc-title">${t.tocLabel}</p>
${sections.map(([, s], i) => html`<a href="#${s.anchor}">${i + 1}. ${s.title}</a>`)}
</nav>
<div class="policy-body">
${sections.map(
  (
    [key, s],
    i,
  ) => html`<section id="${s.anchor}" class="policy-section" aria-labelledby="${s.anchor}-title">
<h2 id="${s.anchor}-title" class="section-title">${i + 1}. ${s.title}</h2>
${paragraphs(s.body)}
${key === 'perApp' ? perAppRows : ''}
${s.items ? html`<ul class="policy-list">${Object.values(s.items).map((item) => html`<li>${withEmail(item)}</li>`)}</ul>` : ''}
${paragraphs(s.outro)}
</section>`,
)}
${pending.privacy ? html`<p class="draft-note">${t.draftNote}</p>` : ''}
</div>
</div>`

  return document(ctx, {
    page: 'privacy',
    title: copy.meta.privacyTitle,
    description: copy.meta.privacyDescription,
    main,
  })
}

export function supportPage(ctx: PageContext): string {
  const { copy } = ctx
  const t = copy.support
  const main = html`<div class="narrow">
<div class="page-head">
<h1 class="display-2">${t.title}</h1>
<p class="lead muted">${t.lead}</p>
</div>
<section class="card mail-card" aria-labelledby="mail-title">
<h2 id="mail-title" class="section-title">${t.mailTitle}</h2>
<p class="muted">${t.mailBody}</p>
${emailLink(owner.email, 'btn btn-action')}
</section>
<section class="faq" aria-labelledby="faq-title">
<h2 id="faq-title" class="section-title">${t.faqTitle}</h2>
${Object.values(t.faq).map(
  (item) => html`<div class="faq-item">
<h3 class="faq-q">${item.q}</h3>
<p class="muted">${item.a}</p>
</div>`,
)}
</section>
</div>`

  return document(ctx, {
    page: 'support',
    title: copy.meta.supportTitle,
    description: copy.meta.supportDescription,
    main,
  })
}

export function notFoundPage(ctx: PageContext): string {
  const { copy, locale } = ctx
  const t = copy.notFound
  const main = html`<section class="not-found" aria-labelledby="nf-title">
<p class="eyebrow eyebrow-teal-ink"><span class="dot" aria-hidden="true"></span>${t.eyebrow}</p>
<h1 id="nf-title" class="display-2">${t.title}</h1>
<p class="muted">${t.body}</p>
<a class="btn btn-action" href="${pagePaths.home[locale]}">${t.cta}</a>
</section>`

  return document(ctx, {
    page: null,
    title: copy.meta.notFoundTitle,
    description: t.body,
    main,
  })
}
