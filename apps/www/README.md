# appelent.nl public site (`apps/www`)

The public site for appelent.nl: home, shared privacy policy, support and 404, in Dutch and English.
Built from the approved design in [`designs/site/site_final.md`](../../designs/site/site_final.md) with
the tokens in [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md). It lives in `apps/www` because the account
portal will take the repository root (APP-476).

## How it works

- `scripts/build.ts` renders every page per locale from the typed catalog (`src/i18n/en.ts`, `nl.ts`)
  into static HTML in `dist/`, with fingerprinted CSS, self-hosted fonts, app icons and Apple's
  App Store badges under `/assets/`. No client JavaScript and no third-party requests.
- `src/worker.ts` runs in front of the assets (`run_worker_first`): the `Accept-Language`/cookie
  negotiation on `/`, the NL | EN switch (`?lang=`), `/account` → account.appelent.nl,
  www → apex, localized 404s with status 404, cache and security headers, and `robots.txt`.
- The favicon set in `public/` comes from developer-home `services/apex-favicon`, with the same
  one-day icon caching. That Worker stays live until the production cutover.

## Commands

From the repository root: `pnpm verify` (Biome, typecheck, tests), `pnpm build`, `pnpm dev`
(builds, then serves the staging config on http://127.0.0.1:8787).

In this folder: `pnpm smoke <origin> [commit]` checks a running site; `pnpm launch:check` lists
open placeholders and fails while any remain.

## Content Eric confirmed (24 Nov 2026)

The site carries no personal info (Eric, 22 Nov 2026): the home is a generic projects showcase. The
items below live in [`src/content/owner.ts`](src/content/owner.ts) and
[`src/content/apps.ts`](src/content/apps.ts). Setting a `pending` flag back to true renders the
item with a dashed outline and a `<!-- PLACEHOLDER (item n) -->` comment, and `pnpm launch:check`
then blocks the production deploy.

1. Contact email: contact@appelent.nl.
2. App Store status: no app is in the App Store yet, so every app shows "Binnenkort".
3. Privacy text: the merged policy in the catalog's `privacy` is approved.

## Staging

A merge to `main` runs `.github/workflows/deploy.yml`: the CI checks, a build, the Worker-name guard,
`wrangler deploy --env staging` (Worker `appelent-www-staging` on the custom domain
`www-stg.appelent.nl`), then the smoke check against that origin. Staging sends `noindex`.

One-time setup for the workflow (repository admin):

1. Create a Cloudflare API token from the "Edit Cloudflare Workers" template, limited to account
   `80ea92f569f5829bb4fa848668fb7e95` and zone `appelent.nl`.
2. `gh api -X PUT repos/AppElent/appelent-site/environments/staging`
3. `gh secret set CLOUDFLARE_API_TOKEN --env staging -R AppElent/appelent-site`
4. `gh variable set CLOUDFLARE_ACCOUNT_ID --env staging -R AppElent/appelent-site --body 80ea92f569f5829bb4fa848668fb7e95`
5. Optional: `gh variable set SMOKE_URL --env staging -R AppElent/appelent-site --body https://www-stg.appelent.nl`
   (the workflow defaults to it).
6. Once a pull request has a green `check`, add the `main` ruleset from developer-home
   `standards/deployments/templates/main-ruleset.json`.

By hand, signed in to Cloudflare: `pnpm deploy:staging` (build, guard, deploy).

## Production

A merge to `main` deploys staging first, then the `production` job: `pnpm launch:check`, build, the
Worker-name guard (`appelent-www`), `wrangler deploy`, and the smoke check against
`https://appelent.nl`. It uses the `production` GitHub Environment (the same Cloudflare token and
account the account portal uses).

The Worker runs on zone routes `appelent.nl/*` and `www.appelent.nl/*`, not custom domains: both
hosts keep their existing proxied DNS records, which the Worker answers in front of; MX, SPF and DKIM
are untouched. `www` 301s to the apex. To roll back, remove the two routes in the Cloudflare
dashboard (Workers → appelent-www → Settings → Domains & Routes) and the parked page returns.

Still open after the cutover: retire developer-home `services/apex-favicon` (its icon routes are more
specific and keep winning, with the same icons), and redirect each app's `/privacy` to
`https://appelent.nl/privacy#app-<id>` (APP-630).
