# account.appelent.nl portal: approved design (APP-481)

Approved by Eric on 22 Nov 2026 (round 2, direction A "list"). Canvas:
[AppElent — Account portal](https://claude.ai/artifact/CqZAWr1GngBPcCU1vFGYb2), page `APP-481 Portal`
(states on `States`, journeys on `Flows`, round 1 cards on `History`). The final artboard source is in
`portal_final/`; every artboard imports `Main.dc.html`, which holds all screens, both languages and both
themes (props `screen`, `app`, `lang`, `theme`, `size`, `persona`, `fail`, `exportState`). The exact copy
lives in `Main.dc.html` (`T`, `D`, `profileSections`). Tokens: [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md).

Build from this file; use the artboards as the visual reference. App icons on the canvas are drawn
stand-ins; the build uses each app's `icon.png` (as `apps/www/assets/apps/`).

## Architecture

No portal database (data model: none). The browser opens one Convex client per app with the Clerk
session's `convex` token and calls that app's `convex/accountPortal.ts`
([account portal standard](https://github.com/AppElent/developer-home/blob/main/standards/account-portal.md), APP-482).
Sign-in and profile are Clerk components (`SignIn`, `UserProfile`) themed with the tokens. Strict CSP,
no third-party scripts beyond Clerk.

## Routes

| Route | Screen | Notes |
| --- | --- | --- |
| `/sign-in` | Sign in | Signed-out visits to any route land here, then return to where they came from |
| `/` | Overview | Tab "Overzicht" |
| `/apps/<app>` | App page | `gather`, `foundry`, `fairway`, `arcade`; tab "Overzicht" stays current |
| `/export` | Download | Tab "Downloaden" |
| `/profiel` (`/profile` in EN) | Profile | Tab "Profiel" |
| anything else | 404 | Status 404, same shell |

Language: Dutch default, English via the NL | EN switch (desktop header), kept in a cookie; `lang` on
`<html>`. Theme follows the OS.

## Shell

- **Header** (64px, `surface-raised`, hairline below): mark 32 + "AppElent" (display 20) + "Account"
  (14, `ink-muted`, divider left). Desktop: tabs Overzicht / Downloaden / Profiel (current: `surface-sunk`
  fill, `ink`, `aria-current="page"`), NL | EN switch, avatar button (initials, 44px, `teal-soft`) that
  opens a menu with "Uitloggen". Phone: brand and avatar in the header, the three tabs in a row below it
  (44px targets, scrolls if needed).
- **Footer** (`surface-sunk`): © 2026 AppElent · Privacy · Support · appelent.nl (links to the public site).
- Content max 1184px; gutter 16 phone / 32 desktop; top padding 24 / 40. H1 display 32 phone / 44 desktop.
- Headings use `text-wrap: balance`, paragraphs `text-wrap: pretty`; button labels never wrap
  (`white-space: nowrap`), and on phone primary actions are full width.

## Sign in

Two columns on desktop (stack on phone): left mark 56, H1 "Je AppElent-account", lead, the four app icons
at 40; right a card with Clerk `SignIn`: "Inloggen", "Gebruik hetzelfde account als in de apps.",
Apple / Google / Microsoft, divider "of", email, "Doorgaan", note "Nog geen account? Dat maak je in een van
de apps." No sign-up here. Methods are the same as in the apps.

## Overview

1. H1 "Hoi <first name>", email below (`ink-muted`).
2. **Je apps** (h2) with "<n> van 4 in gebruik" right. One list card (`surface-raised`, radius 22,
   `shadow-card` light), a row per app in fixed order Gather, Foundry, Fairway, Arcade Club, linking to
   `/apps/<app>`:
   - Desktop row: icon 48, name (17/600) + kind (13, muted), summary line (14, muted: the first three
     `summary.counts` joined with " · "), right a status pill ("In gebruik" `teal-soft`/`teal-ink`;
     "Nog niet gebruikt" `surface-sunk`/muted) and "Laatst actief <date>" under it, chevron.
   - Phone row: icon 44, name + kind on one line (kind ellipsizes), one short line: the first two counts,
     or "Nog niet gebruikt"; no pill, no last-active; chevron. Padding 14/16.
   - "Laatst actief" shows only when the app returns `lastActiveAt`; otherwise it is left out.
3. Side column (below on phone): card "Al je gegevens downloaden" + primary "Naar downloaden"; card
   "Profiel en inloggen" + link "Profiel openen"; quiet `surface-sunk` card "Account verwijderen" with
   "Dat kan nu in elke app onder Instellingen › Account. Binnenkort ook hier, voor één app of alles
   tegelijk." (no button until phase 3, APP-483).

States: **loading** (skeleton rows: icon block + two bars; no count line), **one app unreachable**
(row line in warning ink "Nu niet bereikbaar. Je andere apps werken gewoon.", pill "Niet bereikbaar";
phone line "Niet bereikbaar"; others render normally), **new account** (all four "Nog niet gebruikt" plus a
`teal-soft` note "Je hebt nog geen van de apps gebruikt. Open er een; je logt in met dit account.").
Warning colours (not in the DS yet): light ink `#9a3412`, soft `#fdeee4`, line `#f0c4a8`; dark ink
`#fdba8c`, soft `#3a2418`, line `#7a3e1d`. Add them to the DS as `warn-ink`, `warn-soft`, `warn-line`.

## App page

Back link "‹ Overzicht". Header: icon 72, eyebrow kind, H1 app name, status line ("In gebruik · laatst
actief vandaag" or "Nog niet gebruikt"). Actions: primary "Download <App>-gegevens" (one JSON file for this
app, via `exportPage`), outline "Open <App> ↗" (the app's web URL). Phone: both full width.

- **Used:** card "Wat <App> van je bewaart": a `<dl>` row per `summary.counts` entry (label from the
  portal's catalog, count right, tabular figures; `more` shows "1.000+"). Side: `teal-soft` card "Over de
  download" with an app-specific note, and link "Privacybeleid van <App> ↗" to
  `https://appelent.nl/privacy#app-<id>`.
- **Not used:** card "Je hebt <App> nog niet gebruikt" / "Er staat niets van je opgeslagen. Open <App> om
  te beginnen; je logt in met dit account." (only "Open <App>" as action).
- **Unreachable:** alert card "<App> is nu niet bereikbaar" / "We konden deze app nu niet bereiken. Je
  gegevens zijn veilig; probeer het zo opnieuw." + "Opnieuw proberen".

## Download

H1 "Je gegevens downloaden", lead "Eén zip met een JSON-bestand per app. Je browser haalt alles op en maakt
de zip; je gegevens gaan nergens anders heen." Card "Wat erin komt": a row per app (icon 36, name, status
line). Footer of the card by state:

| State | Rows | Footer |
| --- | --- | --- |
| idle | "<n> soorten gegevens" or "Niets te downloaden" | "Zip maken" + "Duurt meestal minder dan een minuut." |
| working | done "Klaar · 2,1 MB", current "Bezig · sets 1.900 van 5.402" with a progressbar, rest "Wacht" | disabled "Bezig met maken…" (`aria-busy`) + "Annuleren" |
| done | all "Klaar · <size>" | status "Klaar: appelent-gegevens-<date>.zip (<size>) staat in je downloads." + "Opnieuw downloaden" + "Nieuwe zip maken" |
| one failed | that row "Niet gelukt" + "Opnieuw proberen" | alert "<App> lukte niet. De rest is klaar." + "<App> opnieuw proberen" + "Downloaden zonder <App>" |

Apps are fetched one after another; cancelling stops after the current page. The zip holds
`<app>.json` per used app (`{ contract, app, exportedAt, tables }`), built in the browser.

## Profile

H1 "Profiel", lead "Dit profiel geldt voor alle AppElent-apps. Wat je hier wijzigt, zie je overal."
Clerk `UserProfile` in one card, sections Profiel, E-mailadressen, Gekoppelde accounts, Beveiliging
(wachtwoord, passkeys, tweestapsverificatie), Apparaten (sign out per session). Section title left on
desktop, above on phone; long addresses wrap (`overflow-wrap: anywhere`), action buttons stay whole.
Below the card: "Uitloggen" (outline).

## 404

Teal-dot eyebrow "404", "Deze pagina bestaat niet", "De link klopt niet of de pagina is verplaatst.",
primary "Naar het overzicht".

## Accessibility

Text ≥4.5:1 in both themes (DS pairs; warning ink checked on raised and soft). Targets ≥44px. Focus ring
2px `focus-ring`, 2px offset. Tabs are links with `aria-current`. Progress uses `role="progressbar"` with
values; results announce through `role="status"` / `role="alert"`. App icons are decorative
(`aria-hidden`), names are text.

## Decided at approval (defaults; Eric can still change)

1. Direction A (list); cards dropped.
2. "Laatst actief" shows when an app supplies `lastActiveAt`, else hidden.
3. Per-app JSON download on the app page in addition to the zip.
4. Sign-in methods equal to the apps (Apple, Google, Microsoft, email).

## Open at build time

- Clerk: add `account.appelent.nl` and `account-stg.appelent.nl` origins and redirect URLs (dev + prod).
- Each app's `convex/accountPortal.ts` (APP-482) must be deployed before its row can load; until then the
  row shows the unreachable state.
