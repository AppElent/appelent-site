# account.appelent.nl: delete one app's data or the whole account: approved design (APP-483)

Eric approved this on 27 Nov 2026 ("Goed, met alleen het vakje"). One-app deletion asks for a tick box only, with no typed app name.

- **Canvas:** [AppElent — Account portal](https://claude.ai/artifact/CqZAWr1GngBPcCU1vFGYb2), page `APP-483 Verwijderen`.
- **Source:** [`deletion_final/`](deletion_final/). Every artboard imports `Del.dc.html`, which takes these props:
  - `screen`: `app`, `appBlocked`, `appConfirm`, `all`, `allBlocked`, `allReverify`, `allProgress`, `allRetry` or `done`
  - `theme`: light or dark
  - `lang`: nl or en
  - `size`: desktop or phone
- **Copy and layout:** it reuses the tokens and the header of [portal_final.md](portal_final.md).
- **Data model:** none. The browser calls each app's `convex/accountPortal.ts` (`deletionBlocker`, `deleteAppData`).
- **Waits on:** APP-392 (the `user.deleted` webhooks live), APP-242, and grouping the Apple App IDs under Foundry.

## One app (`/apps/<app>`)

The delete card on the app page opens this screen.

| Artboard | What it shows |
| --- | --- |
| `D483-App`, `P483-App` | What goes, as counts. A shared household stays for the other members, and a household with only you goes entirely. It offers "Download first?". The red button is disabled until "I understand this cannot be undone" is ticked. |
| `D483-AppConfirm` | Ticked: the button becomes red and active. |
| `D483-AppBlocked` | The app's `deletionBlocker` says no, for example "You are the only admin of Familie Jansen…". The screen says what to do first and links to it in the app. The check runs again when you come back. |

Deleting one app's data never calls Clerk `user.delete()` and never revokes Apple. Your login stays.

## Whole account (`/verwijderen`, then `/klaar`)

Three steps, shown as a step bar:

1. **Check** (`D483-All`, `DE483-All`, `P483-All`, `D483-AllBlocked`). Each app, plus Sign in with Apple, shows "Ready" or "Sort out first", with a link to fix it. One blocker keeps Continue disabled.
2. **Confirm** (`D483-Reverify`). The tick box "I understand that my account and my data in every app go…" plus Clerk reverification: a code, a password or a passkey.
3. **Delete** (`D483-Progress`, `P483-Progress`). It runs in order, with progress per app:
   - Apple revocation through Foundry `revokeAppleSignIn`, only if Apple is linked.
   - `deleteAppData` in every app.
   - Clerk `user.delete()`, last.

   If one app fails (`D483-Retry`, `DE483-Retry`), the account still exists, the rest is already gone, and "Try again" retries the failed app. The `user.deleted` webhooks remain the safety net if the person leaves.

**Done** (`D483-Done`, `PE483-Done`): "Your account is deleted", signed out, with a hint to remove the app from your phone, and a link to appelent.nl.

## Copy (nl / en)

| Key | nl | en |
| --- | --- | --- |
| One app title | Gegevens van {app} verwijderen | Delete your {app} data |
| One app button | Verwijder mijn {app}-gegevens | Delete my {app} data |
| Tick | Ik begrijp dat dit niet ongedaan kan worden gemaakt. | I understand this cannot be undone. |
| Whole title | Je hele AppElent-account verwijderen | Delete your whole AppElent account |
| Steps | Controleren / Bevestigen / Verwijderen | Check / Confirm / Delete |
| Status | Kan / Eerst regelen / Bezig… / Wacht / Verwijderd / Mislukt | Ready / Sort out first / Working… / Waiting / Deleted / Failed |
| Reverify | Bevestig dat jij het bent | Confirm it’s you |
| Retry | Eén app lukte nog niet / Probeer opnieuw | One app didn’t work yet / Try again |
| Done | Je account is verwijderd | Your account is deleted |
