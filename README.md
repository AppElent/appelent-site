# appelent-site

The public appelent.nl site and the account portal (APP-476).

- [`apps/www`](apps/www/README.md): the public site (home, privacy, support), a Cloudflare Worker
  with static assets. Phase 1 deploys to staging only (`www-stg.appelent.nl`).
- [`apps/account`](apps/account/README.md): the account portal (`account.appelent.nl`), TanStack
  Start on a Cloudflare Worker. APP-481 deploys staging only (`account-stg.appelent.nl`).
- [`designs/site`](designs/site/site_final.md), [`designs/portal`](designs/portal/portal_final.md) and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): the
  approved design.

Requires Node 22.18+ and pnpm 11. `pnpm install`, then `pnpm verify` (Biome, typecheck, tests) and
`pnpm dev` (site) or `pnpm dev:account` (portal).
