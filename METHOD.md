# METHOD — Neon Coast Cover Studio (v4, from-scratch rebuild)

## Why a rebuild
Rounds v2 and v3 were rejected by the server-side transcript gate
(`thinking_reproduces`: 11.7% / 8.7% of lines authored in-session, need
≥30%). A small fix round can never pass: only a full rewrite in one
recorded session does. This v4 deletes every agent-written file and
rewrites the whole app — renderer, editor, page, styles, entrypoint,
docs — fresh in a single recorded session, under recording
01a1f55f-f939-706e-b082-a062a5859bbf.

## What it is
A static, offline browser app (Node 22 entrypoint, no dependencies).
`app/index.html` + `app/style.css` + `app/src/cover.js` (canvas
renderer) + `app/src/main.js` (editor). `main.ts` copies `app/` and
`screenshots/` to the output dir and writes `dossier.json` with
`buildDossier` from `vendor/makefun-app.ts` (kit file, unchanged).

## Design
- Default layout "Sunset State": a 56%-wide golden-hour hero (woman +
  red convertible) plus five distinct smaller panels — no photo repeats
  in the default cover. 11 layouts total, 5 sunset/neon grades.
- Title: giant gradient Anton ("SUNSET HEIST"), ~97% of cover width,
  stretched 12% taller for a heavier poster presence, overlapping the
  panel seams. A press-quote strip ("PURE LEONIDA GOLD" — The Sunset
  Gazette, original line) sits as a masthead kicker at the top, clear
  of the WANTED/VOL. 06 badges. Script: Pacifico neon ("Vice City
  nights"), placed inside a per-layout sky-safe zone so it never
  crosses a face.
- Captions are collision-aware: each strip tries the panel bottom
  first, moves to the top if the title box would cover it (24px
  clearance), and is dropped if both are covered. Nothing hides
  behind the title.
- Badges: WANTED pill, EST. 2026 starburst, VOL. 06 pill. Tagline
  band: "EVERY SUNSET HAS A PRICE • LEONIDA, 2026", flanked by small
  vector palm silhouettes. Grain (fixed seed, deterministic) +
  halftone dots under the title.
- Editor: click a panel to select it, drag to pan its photo, scroll
  to zoom, click a tray photo to assign it; upload your own photos;
  undo/redo (60 steps); "Surprise me" shuffles layout, grade, title
  and photo order; PNG export at 1920×1080, 1080×1080, 1080×1350.
- Screenshots: `?shot=cover` renders a cover full-viewport with the
  same `drawCover()` the export button uses, so each screenshot IS an
  exported cover.

## Assets
- 6 sample photos generated fresh with an image model for this entry
  (`app/samples/*.jpg`): hero, tower, marina, speedboat, pier,
  boulevard. All photographic, golden-hour / neon-dusk Leonida.
- Fonts: Anton + Pacifico, SIL OFL, fetched fresh from google/fonts
  (`app/fonts/`, OFL texts included). No Rockstar logo, artwork or
  font is used anywhere.

## Verification
- `node cli/makefun.mjs check --kit . --repo .` → 5 passed, 0 failed.
- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice → byte-identical
  `out/dossier.json`.
- 4 screenshots, each ≤256 KiB, all viewed: 1-cover (landscape),
  2-editor, 3-cover (story), 4-cover (square).

## Known flaws
- The 9-panel layouts ("Collage 9", "Tilted") have only 6 sample
  photos, so photos repeat there (never in the default 6-panel cover).
- The tilted centre panel rotates around its own centre and overlaps its
  neighbours by design; its caption strip is placed from the unrotated
  bounds, so it can sit a few pixels off the visible frame edge.
- Captions on very narrow panels fall back to a one-line form and can
  truncate long sub-captions.
