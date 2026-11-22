# AppElent account portal (`apps/account`)

account.appelent.nl: one place to see which AppElent apps you use, download your data, and manage
your sign-in. Built from the approved design in
[`designs/portal/portal_final.md`](../../designs/portal/portal_final.md) with the tokens in
[`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md). APP-481 ships staging only (`account-stg.appelent.nl`).

## How it works

- TanStack Start on a Cloudflare Worker (`@cloudflare/vite-plugin`). The Worker server-renders each
  page and sends a strict Content-Security-Policy with a fresh nonce: only this origin, the Clerk
  Frontend API, Clerk's bot protection (`challenges.cloudflare.com`, `*.protect.clerk.com`), and the
  four app Convex hosts. The CSP is built from the same build values the browser uses
  (`src/lib/csp.ts`), so the two cannot drift.
- Sign-in uses the shared Clerk app "AppElent": themed `SignIn` (no sign-up; accounts start in the
  apps) and `UserProfile`. Signed-out visits go to `/sign-in?redirect=<path>` and come back.
- No portal database. The browser opens one `ConvexHttpClient` per app (Gather, Foundry, Fairway,
  Arcade Club), signed in with the Clerk `convex` token, and calls that app's
  `accountPortal.summary` and `accountPortal.exportPage` (developer-home
  `standards/account-portal.md`, contract 1). Every response is validated in
  `src/portal/contract.ts`. A missing function, a network error, a timeout or a malformed answer
  shows that app as unreachable; the others keep working.
- The download runs in the browser: each used app is exported page by page, then zipped
  (`fflate`) into `appelent-gegevens-<date>.zip` with one `<app>.json` per app. Per-app progress,
  cancel, retry per app, or "download without <app>". Nothing passes through the Worker.
- Dutch by default, English through the `lang` cookie (NL | EN switch). Light and dark follow the OS.

## Commands

From the repository root: `pnpm verify` (Biome, typecheck, tests for every app) and
`pnpm dev:account` (http://127.0.0.1:3481).

In this folder:

- `pnpm env:check local` / `pnpm env:generate`: the env manifest (`env.manifest.ts`). `.env.local`
  holds the local build values (Clerk dev key, dev Convex URLs); `.env.example` lists them.
- `pnpm build` then `pnpm preview`: the built Worker in workerd.
- `pnpm smoke <origin>`: signed-out checks of a running portal (routes, 404s, CSP and headers).
- `node scripts/guard-worker.ts <worker>` after a build: fails on a wrong Worker name or any
  production route.

### Fake apps in development

Until each app ships `convex/accountPortal.ts` (APP-482), `pnpm dev` can use fake app clients with
the design's data: open any page with `?fake=regular`, `new`, `foundry-down`, `export-fails` or
`slow` (remembered for the tab). Dev builds only; production bundles do not contain them.

## Staging

A merge to `main` runs the `account-staging` job in `.github/workflows/deploy.yml`: the CI checks,
`env.mjs check staging --ci`, a `CLOUDFLARE_ENV=staging` build, the Worker-name guard,
`wrangler deploy` (Worker `appelent-account-staging` on the custom domain
`account-stg.appelent.nl`), then the smoke check.

Staging signs in with the production Clerk instance (`pk_live_`), so its Convex URLs point at each
app's staging-web deployments (see the table in `env.manifest.ts`). One-time setup on the GitHub
`staging` Environment (repository admin), besides the `CLOUDFLARE_API_TOKEN` secret and
`CLOUDFLARE_ACCOUNT_ID` variable the site already uses: `pnpm env:apply staging` from Infisical, or
by hand `gh variable set <NAME> --env staging -R AppElent/appelent-site --body <value>` for
`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_GATHER_CONVEX_URL`, `VITE_FOUNDRY_CONVEX_URL`,
`VITE_FAIRWAY_CONVEX_URL` and `VITE_ARCADE_CONVEX_URL`.

Clerk (dashboard, per instance): allow the origin and redirect URLs for `https://account-stg.appelent.nl`
(production instance) and `http://localhost:3481` / `http://127.0.0.1:3481` (development instance).

## Production (not in APP-481)

The top-level `wrangler.jsonc` has no routes; `test/wrangler.test.ts` and the guard fail if it gets
one. Production (`account.appelent.nl`) is a separate change with Eric's go.
