# AppElent account portal (`apps/account`)

account.appelent.nl: one place to see which AppElent apps you use, download your data, and manage
your sign-in. Built from the approved design in
[`designs/portal/portal_final.md`](../../designs/portal/portal_final.md) with the tokens in
[`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md). Staging is `account-stg.appelent.nl`, production `account.appelent.nl`.

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
- Each app page has two tabs: **Jouw gegevens** (`/apps/<app>`) and **Wat is er nieuw**
  (`/apps/<app>/whats-new`, APP-628), a weekly digest per app from
  [`content/whats-new`](../../content/whats-new/README.md), bundled at build time. Its type,
  version and from-date filters live in the query (`?type=new&version=1.1.0&from=2026-11-01`).
- Dutch by default, English through the `lang` cookie (NL | EN switch). An app that opens the
  portal passes its language as `?lang=en|nl` (APP-673): it wins over the cookie on that load and is
  saved to the cookie. An in-app browser does not share the app's Clerk session, so the portal asks
  to sign in again there; a sign-in handoff is out of scope. Light and dark follow the OS.

## Commands

From the repository root: `pnpm verify` (Biome, typecheck, tests for every app) and
`pnpm dev:account` (http://127.0.0.1:3481).

In this folder:

- `pnpm env:check local` / `pnpm env:generate`: the env manifest (`env.manifest.ts`). `.env.local`
  holds the local build values (Clerk dev key, dev Convex URLs); `.env.example` lists them.
- `pnpm build` then `pnpm preview`: the built Worker in workerd.
- `pnpm smoke <origin>`: signed-out checks of a running portal (routes, 404s, CSP and headers).
- `node scripts/guard-worker.ts <worker>` after a build: fails on a wrong Worker name or on any
  route other than that Worker's own custom domain.

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
`staging` Environment (repository admin), from the shared Infisical project (`.infisical.json`, folders `/`
and `/account`, Infisical `prod` for staging):

```sh
cd apps/account
pnpm env:plan staging     # shows what is missing in Infisical and what would change on GitHub
pnpm env:apply staging    # writes the GitHub `staging` Environment variables and secret
```

The four `*-convex-url` keys live in Infisical `prod` under `/account` (values in the table in
`env.manifest.ts`); `clerk-publishable-key`, `cloudflare-account-token` and `cloudflare-account-id` are
shared at `/`.

Clerk needs no change: the production instance accepts every `appelent.nl` subdomain, and the portal
uses the plain session token (Clerk's native Convex integration, no JWT template).

## Production

After staging passes its smoke check, the `account-production` job builds the top-level Worker
(`appelent-account`, custom domain `account.appelent.nl`), runs `env.mjs check production --ci` and the
guard, deploys and smoke-checks it. Production calls each app's production deployment (see the
production table in `env.manifest.ts`). Gather and Fairway reuse their `*-convex-url` keys; Foundry and
Arcade Club read `foundry-convex-url-production` and `arcade-convex-url-production` from Infisical
`prod` under `/account`. One-time setup of the GitHub `production` Environment:

```sh
cd apps/account
pnpm env:plan production
pnpm env:apply production
```
