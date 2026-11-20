# Design system

The canvas design system is the [AppElent Design System artifact](https://claude.ai/artifact/PBhrWSBiiAaCm9q1h5rPFo).
It covers appelent.nl (the public site) and, later, the account portal on account.appelent.nl.
Every design starts from it; an approved token change updates the artifact and the code tokens in the same change.

## Source

Everything derives from the AppElent icon (`designs/site/assets/appelent-mark.svg`, originally
developer-home `services/apex-favicon/public/favicon.svg`): a slate tile, a chalk A and a teal dot.

## Tokens

Light and dark follow the OS (`prefers-color-scheme`).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `surface` | `#f6f7fb` | `#12161f` | Page background |
| `surface-raised` | `#ffffff` | `#1c2333` | Cards |
| `surface-sunk` | `#eceff6` | `#0d1018` | Footer |
| `line` | `#dde2ec` | `#2c3549` | Hairlines, card borders |
| `ink` | `#1c2333` | `#f4f6fb` | Text |
| `ink-muted` | `#55607a` | `#a7b1c6` | Secondary text (5.4:1+) |
| `slate` / `slate-deep` | `#3b4a6b` / `#1c2333` | same | Brand fields: hero and contact band, `linear-gradient(135deg, slate, slate-deep)` |
| `chalk` | `#f4f6fb` | same | Text on slate |
| `teal` | `#7fd1c8` | same | Accent fill only (dots), and text on slate |
| `teal-ink` | `#1d6f67` | `#7fd1c8` | Links, accent text |
| `teal-soft` | `#e2f4f2` | `#14302e` | Tinted bands and pills |
| `action` / `on-action` | `#1c2333` / `#f4f6fb` | `#f4f6fb` / `#1c2333` | Primary button |
| `focus-ring` | `#1d6f67` | `#7fd1c8` | 2px ring, 2px offset |

Type: Bricolage Grotesque 600 for display (64/64 hero desktop, 40/44 phone; 44/48 and 32/38 section
titles; 28/34 app names), Inter for text (18/28 lead, 16/24 body, 14/20 small, 12/16 eyebrow uppercase
+0.08em). Spacing on a 4px base; gutter 16 phone, 32 desktop; content max 1184px. Radius 22px cards,
22% app icons, 14px buttons and badges, 8px small controls, 999px pills.
