// The account portal's environment manifest (developer-home
// standards/environments.md). Values live in Infisical, never here.
//
// The portal has no Convex backend of its own. Its browser calls each app's
// `accountPortal` functions (developer-home standards/account-portal.md), so
// the only build values are the shared Clerk key and one public Convex URL per
// app. Which deployment each URL points at follows the app's own manifest:
//
// | App (repo)                  | production (Infisical prod)       |
// | --------------------------- | --------------------------------- |
// | Foundry (AppElent/workouts) | fine-akita-444 (prod)             |
// | Gather (AppElent/gather)    | limitless-bulldog-972 (prod)      |
// | Fairway (AppElent/golf-app) | giddy-pelican-141 (prod)          |
// | Arcade Club (AppElent/games)| chatty-ram-217 (prod)             |
//
// | App (repo)                  | staging (Infisical prod)          | local (Infisical dev)        |
// | --------------------------- | --------------------------------- | ---------------------------- |
// | Foundry (AppElent/workouts) | fearless-mouse-671 (staging web)  | colorless-sturgeon-704 (dev) |
// | Gather (AppElent/gather)    | limitless-bulldog-972 (prod; ADR-0039) | the app's dev deployment |
// | Fairway (AppElent/golf-app) | giddy-pelican-141 (prod)          | the app's dev deployment     |
// | Arcade Club (AppElent/games)| blessed-blackbird-8 (staging web) | zany-parakeet-507 (dev)      |
//
// Each is `https://<deployment>.eu-west-1.convex.cloud`. Staging signs in with
// the production Clerk instance (pk_live_, clerk.appelent.nl), so it must call
// the deployments that app's staging web uses. The Worker builds its
// Content-Security-Policy from these same values.
//
// Staging and production both read Infisical prod. Gather and Fairway use one
// deployment for both, so one key serves both. Foundry and Arcade Club have a
// separate staging deployment, so production reads its own
// `<app>-convex-url-production` key.

export const ENV_CONFIG = {
  appName: 'account',
  source: { paths: ['/', '/account'] },
  worker: { name: 'appelent-account' },
  github: { repository: 'AppElent/appelent-site' },
}

export const ENVIRONMENTS = ['local', 'staging', 'production'] as const

const WEB = ['local', 'staging', 'production']
const DEPLOYED = ['staging', 'production']
const BEFORE_PRODUCTION = ['local', 'staging']

const convexUrl = (
  app: string,
  name: string,
  environments: string[] = WEB,
  suffix = '',
) => ({
  key: `${app}ConvexUrl${suffix ? 'Production' : ''}`,
  infisicalKey: `${app}-convex-url${suffix}`,
  description: `Public Convex URL of ${name}; see the tables at the top of this file`,
  secret: false,
  lands: {
    'vite-build': {
      name: `VITE_${app.toUpperCase()}_CONVEX_URL`,
      environments,
    },
  },
})

export const ENTRIES = [
  {
    key: 'clerkPublishableKey',
    infisicalKey: 'clerk-publishable-key',
    description:
      'Shared AppElent Clerk app: pk_test_ in Infisical dev, pk_live_ in prod',
    secret: false,
    lands: {
      'vite-build': { name: 'VITE_CLERK_PUBLISHABLE_KEY', environments: WEB },
    },
  },
  convexUrl('gather', 'Gather'),
  convexUrl('foundry', 'Foundry (workouts)', BEFORE_PRODUCTION),
  convexUrl('foundry', 'Foundry (workouts)', ['production'], '-production'),
  convexUrl('fairway', 'Fairway (golf-app)'),
  convexUrl('arcade', 'Arcade Club (games)', BEFORE_PRODUCTION),
  convexUrl('arcade', 'Arcade Club (games)', ['production'], '-production'),
  {
    key: 'cloudflareApiToken',
    infisicalKey: 'cloudflare-account-token',
    description: 'Worker deploy token',
    secret: true,
    lands: {
      workflow: { name: 'CLOUDFLARE_API_TOKEN', environments: DEPLOYED },
    },
  },
  {
    key: 'cloudflareAccountId',
    infisicalKey: 'cloudflare-account-id',
    description: 'Cloudflare account for Worker deploys',
    secret: false,
    lands: {
      workflow: { name: 'CLOUDFLARE_ACCOUNT_ID', environments: DEPLOYED },
    },
  },
]
