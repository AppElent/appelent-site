# appelent-site

The public appelent.nl site and, later, the account portal (APP-476).

- [`apps/www`](apps/www/README.md): the public site (home, privacy, support), a Cloudflare Worker
  with static assets. Phase 1 deploys to staging only (`www-stg.appelent.nl`).
- [`designs/site`](designs/site/site_final.md) and [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): the
  approved design.

Requires Node 22.18+ and pnpm 11. `pnpm install`, then `pnpm verify` (Biome, typecheck, tests) and
`pnpm dev`.
