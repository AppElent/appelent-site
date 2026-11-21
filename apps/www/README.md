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

## Placeholders (Eric supplies)

All live in [`src/content/owner.ts`](src/content/owner.ts) (with the catalog keys named there) and
[`src/content/apps.ts`](src/content/apps.ts). Each renders with a dashed outline and a
`<!-- PLACEHOLDER (item n) -->` comment until its `pending` flag is false.

1. Photo: commit a square photo (≥400px) to `assets/`, set `owner.photo`.
2. Hero bio: `home.hero.body` in `en.ts` and `nl.ts`, then `pending.bio = false`.
3. Third "Wat ik doe" card: `home.does.work`, then `pending.workCard = false`.
4. Contact email (`owner.email`, today privacy@appelent.nl) and LinkedIn (`owner.linkedin`).
5. App Store status per app: `appStore: 'live' | 'soon'` in `apps.ts`. Arcade Club is `soon`.
6. Privacy text: the draft in the catalog's `privacy` merges the four app policies.

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

## Production (not in phase 1)

Nothing here routes `appelent.nl` or `www.appelent.nl`; the guard and `test/wrangler.test.ts` fail if
anything does. The cutover is its own change, after Eric's content and his go:

1. `pnpm launch:check` passes.
2. Add the `appelent.nl` and `www.appelent.nl` custom domains to the top-level config in
   `wrangler.jsonc`, drop the phase-1 route check in `scripts/guard-worker.ts` and its test.
3. Add a `production` job to `deploy.yml` (`needs: staging`, `environment: production`, main only,
   `launch:check`, guard `appelent-www`, smoke `https://appelent.nl`).
4. Move the apex DNS from the Vimexx parked page to the Worker, leaving MX, SPF and DKIM untouched.
5. Retire developer-home `services/apex-favicon`; redirect each app's `/privacy` to
   `https://appelent.nl/privacy#app-<id>`.
