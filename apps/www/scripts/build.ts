// Builds the static site into dist/: one HTML file per page and locale,
// fingerprinted assets under /assets/, the favicon set from public/ at the
// root (absorbed from developer-home services/apex-favicon), a sitemap and
// version.json. The Worker (src/worker.ts) serves dist/ through the assets
// binding. Run with `node scripts/build.ts` (Node ≥22.18 strips the types).

import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apps } from '../src/content/apps.ts'
import { owner } from '../src/content/owner.ts'
import { type Locale, locales } from '../src/i18n/index.ts'
import { homePage } from '../src/render/home.ts'
import { type AssetUrls, context } from '../src/render/layout.ts'
import { notFoundPage, privacyPage, supportPage } from '../src/render/pages.ts'
import {
  notFoundPaths,
  origin,
  outputFile,
  type PageId,
  pagePaths,
} from '../src/routes.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const require = createRequire(import.meta.url)

function fontFile(pkg: string, file: string): string {
  return join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file)
}

/** Copies a file to dist/assets/<name>.<hash><ext> and returns its URL. */
function fingerprint(source: string, contents?: Buffer | string): string {
  const data = contents ?? readFileSync(source)
  const hash = createHash('sha256').update(data).digest('hex').slice(0, 10)
  const ext = extname(source)
  const name = `${basename(source, ext)}.${hash}${ext}`
  writeFileSync(join(dist, 'assets', name), data)
  return `/assets/${name}`
}

export function build(): void {
  rmSync(dist, { recursive: true, force: true })
  mkdirSync(join(dist, 'assets'), { recursive: true })
  cpSync(join(root, 'public'), dist, { recursive: true })

  const fonts = {
    text: fingerprint(
      fontFile('@fontsource-variable/inter', 'inter-latin-wght-normal.woff2'),
    ),
    display: fingerprint(
      fontFile(
        '@fontsource-variable/bricolage-grotesque',
        'bricolage-grotesque-latin-opsz-normal.woff2',
      ),
    ),
  }
  const css = readFileSync(join(root, 'src/styles.css'), 'utf8')
    .replace('__FONT_TEXT__', fonts.text)
    .replace('__FONT_DISPLAY__', fonts.display)

  const assets: AssetUrls = {
    css: fingerprint(join(root, 'src/styles.css'), css),
    mark: fingerprint(join(root, 'public/favicon.svg')),
    fonts,
    appIcons: Object.fromEntries(
      apps.map((app) => [
        app.id,
        fingerprint(join(root, `assets/apps/${app.id}.png`)),
      ]),
    ) as AssetUrls['appIcons'],
    badges: {
      nl: fingerprint(join(root, 'assets/badges/app-store-nl-nl.svg')),
      en: fingerprint(join(root, 'assets/badges/app-store-en-us.svg')),
    },
    photo: owner.photo ? fingerprint(join(root, 'assets', owner.photo)) : null,
  }

  const renderers: Record<PageId, typeof homePage> = {
    home: homePage,
    privacy: privacyPage,
    support: supportPage,
  }
  const write = (path: string, body: string) => {
    const file = join(dist, outputFile(path))
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, body)
  }
  for (const locale of locales) {
    const ctx = context(locale as Locale, assets)
    for (const page of Object.keys(renderers) as PageId[]) {
      write(pagePaths[page][locale], renderers[page](ctx))
    }
    write(notFoundPaths[locale], notFoundPage(ctx))
  }

  writeFileSync(join(dist, 'sitemap.xml'), sitemap())
  writeFileSync(
    join(dist, 'version.json'),
    `${JSON.stringify({ commit: process.env.GITHUB_SHA ?? 'local' })}\n`,
  )
}

function sitemap(): string {
  const urls = (Object.keys(pagePaths) as PageId[]).flatMap((page) =>
    locales.map((locale) => {
      const alternates = locales
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l}" href="${origin}${pagePaths[page][l]}"/>`,
        )
        .join('\n')
      return `  <url>\n    <loc>${origin}${pagePaths[page][locale]}</loc>\n${alternates}\n  </url>`
    }),
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build()
  console.log(`Built ${dist}`)
}
