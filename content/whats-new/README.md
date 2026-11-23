# What's new (APP-628)

The weekly digests behind the account portal's **Wat is er nieuw** tab
(`account.appelent.nl/apps/<app>/whats-new`). Written, not generated: the daily
maintainer round reads developer-home's `changelog.json` (branch `changelog`)
and turns the new user-facing rows into a short digest per app and ISO week.

```
content/whats-new/<app>/<yyyy>-W<ww>.json   the digest the page shows (nl and en)
content/whats-new/<app>/img/*.webp          its screenshots, under 150 KB each
content/whats-new/<app>/sources.json        week -> changelog row ids it covers
```

`<app>` is `gather`, `foundry`, `fairway` or `arcade`. Screenshots are bundled
with the portal (served from its own origin, no hotlinking). `sources.json` is
never bundled.

## A week file

```json
{
  "week": "2026-W47",
  "stage": "web",
  "since": "2026-11-22",
  "version": "1.1.0",
  "unreleased": true,
  "new": [
    {
      "title": { "nl": "…", "en": "…" },
      "body": { "nl": "…", "en": "…" },
      "screenshots": [
        { "file": "2026-w47-shopping.webp", "width": 645, "height": 1400,
          "alt": { "nl": "…", "en": "…" } }
      ]
    }
  ],
  "fixed": [{ "nl": "…", "en": "…" }]
}
```

`stage`, `since`, `version` and `unreleased` are written by `pnpm whats-new
sync`; never edit them by hand. `stage` is what every change of the week
reached: `web` (production web app), `app` (production app update) or `store`.

## Writing rules

- Only what a user notices. Developer-only rows (CI, review rules, contracts,
  `/version`) go in `sources.json` but not on the page.
- 3 to 6 `new` items with one or two plain sentences; the rest as one-line
  `fixed` bullets. Dutch first, plain words, no jargon.
- One or two screenshots per `new` item, phone shots first. Check every
  screenshot: no real names, emails, addresses or internal labels (issue ids,
  "Dev" builds, tool inspectors).
- No PR numbers, issue ids, links or email addresses in any text; the content
  test refuses them.

## The daily step

From the repository root, with developer-home's `changelog.json` downloaded:

```sh
pnpm whats-new pending changelog.json        # new rows per app and week
pnpm whats-new shot gather 2026-W48 slug URL # one screenshot, prints its entry
# write or extend the week files, add every handled row id to sources.json
pnpm whats-new sync changelog.json           # stage, since, version
pnpm verify                                  # the content test checks it all
```

Then open a pull request `docs(whats-new): <app> digest <week>`, tier `low`.
