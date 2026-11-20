# appelent.nl public site: approved design (APP-480)

Approved by Eric on 20 Nov 2026 (round 2). Canvas:
[AppElent — Public site](https://claude.ai/artifact/UmbMBcz7szqzH6jSVrDsbM), page `APP-480 Public site`
(round 1 on page `History`). The final artboard source is in `site_final/`; every artboard imports
`Main.dc.html`, which holds all screens, both languages and both themes (props `screen`, `lang`,
`theme`, `size`). The exact copy lives in `Main.dc.html` (`T`, `A`, `DOES`, `STORES`, `POLICY`, `FAQ`).
Tokens: [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md).

Build from this file; use the artboards as the visual reference.

## Routes

| Route | Screen | Notes |
| --- | --- | --- |
| `/` and `/en/` | Home | Personal showcase + apps |
| `/privacy`, `/en/privacy` | Shared privacy policy | One policy for all apps; anchors `#app-gather`, `#app-foundry`, `#app-fairway`, `#app-arcade` |
| `/support`, `/en/support` | Support | Shared for all apps |
| `/account` | none | 302 to `https://account.appelent.nl` |
| anything else | 404 | Status 404, same shell |

`www.appelent.nl` 301s to the apex. Language: `/` follows `Accept-Language` on the first visit only
(nl → Dutch, else English); a choice in the switch is kept in a cookie. Every page has `hreflang`
alternates and `lang` on `<html>`. Theme follows the OS; no toggle.

## Shell (every page)

- **Header** (64px): mark 32px + "AppElent" (display 20), nav Over mij / Apps / Privacy / Support
  (EN: About / Apps / Privacy / Support), NL | EN segmented switch (current: ink fill, `aria-current`).
  Below 720px the nav is hidden (its links are in the footer); brand and switch stay.
- **Footer** (`surface-sunk`): brand + "Eric Jansen. Apps voor thuis, sport en spel."; Apps column (web
  app links); AppElent column (Privacy, Support, Account); Contact column (mail, © 2026 AppElent).
  Desktop 2fr 1fr 1fr 1fr, phone two columns.

## Home, in order

1. **Hero** (slate gradient field, radius 22): photo (96px desktop / 80px phone circle), "Eric Jansen"
   and the eyebrow "Maker van AppElent" with a teal dot; H1 "Hoi, ik ben Eric. Ik bouw apps."; one
   or two sentences of bio; buttons "Bekijk mijn apps" (`#apps`, chalk fill) and "Neem contact op"
   (`#contact`, outline). Right on desktop: the four app icons 2×2 at 112px; phone: a row of four at 64px below.
2. **Wat ik doe**: three cards (3 columns desktop, stacked phone): apps for everyday life, a software
   factory with AI, Eric's work.
3. **Wat ik maak** (`#apps`): one card per app, 2×2 desktop, stacked phone. Icon 64px, eyebrow kind,
   name in display 28, one sentence, then the App Store badge (or the dashed "Binnenkort" / "Coming soon"
   state for an app that is not public; never a dead link) and "Open web-app" (outline, ↗).
4. **Eén account voor alle apps** band (`teal-soft`), button to account.appelent.nl.
5. **Waarmee ik bouw**: one line + pills (TanStack Start, Convex, Expo, Clerk, Cloudflare Workers,
   Claude Code, Linear).
6. **Contact** (`#contact`, slate field): line + "Mail me", GitHub (github.com/AppElent), optional LinkedIn.

## Privacy (shared)

Title, lead, a scope pill listing all apps, "Laatst bijgewerkt". Desktop: contents box (max 260px) left,
policy right (max 720px); phone: contents above. Sections: 1 Wie we zijn, 2 Je account, 3 Wat elke app
bewaart (a row per app with icon and what it stores, anchored), 4 Diensten die we gebruiken, 5 Inzien en
verwijderen, 6 Contact. The design text is a draft: the final text merges the four current app policies
(`gather`, `workouts`, `golf-app`, `games` `src/routes/privacy.tsx`) and Eric approves it in the PR. Each
app's `/privacy` then redirects to `https://appelent.nl/privacy#app-<id>` (follow-up per app repo).

## Support (shared)

Title, lead, a "Mail ons" card with a primary mail button, and three FAQ items (delete account, one
account, Android). Plain headings and paragraphs, no accordion.

## 404

Teal-dot eyebrow "404", title, one line, primary button to the home page.

## Assets

- Mark: `designs/site/assets/appelent-mark.svg` (also the favicon set from developer-home
  `services/apex-favicon`, which this site absorbs).
- App icons: each app repo's `icon.png`, rendered with 22% radius.
- App Store badges: Apple's official artwork per locale (nl-NL, en-US). Store IDs: Gather 6801454605,
  Foundry 6811609419, Fairway 6833832527, Arcade Club 6832923667.

## Open at build time (Eric supplies)

1. Photo (square, ≥400px). Until then the build keeps the dashed "EJ" placeholder off production.
2. Bio sentences for the hero (NL + EN).
3. The third "Wat ik doe" card: Eric's work.
4. Contact email on the site (today privacy@appelent.nl) and whether LinkedIn or other links appear.
5. Which apps show the App Store badge at launch (drawn: Arcade Club "Binnenkort").
6. Final privacy text.

## Accessibility

Text contrast ≥4.5:1 in both themes (checked for every text token pair). Touch targets ≥44px. Focus ring
2px `focus-ring`, 2px offset. Decorative icons `aria-hidden`; the hero icon grid is decorative.
