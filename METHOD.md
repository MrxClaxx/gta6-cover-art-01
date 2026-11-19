# METHOD — Neon Coast Cover Studio (gta6-cover-art-01)

## What it is
An offline browser app that turns any photo + caption into GTA-style cover art.
`app/index.html` + `app/style.css` + `app/src/cover.js` (canvas renderer) +
`app/src/main.js` (editor). No build step, no network at runtime: every file it
loads is under `app/` (vendored Anton + Pacifico TTFs with OFL texts, 6 sample
photos: 2 kit photos + 4 model-made).

## v2 — centred-logo rebuild (live rank #89, judge 0.864)
The v1 cover ranked #89 of 3,371: the title was too small and sat in a bottom
band, and the fisherman photo appeared twice. Comparing our artifact with the
top 3 (Sunset State 0.939, Neon Coast 0.936, Vice State 0.934) and with the
official GTA VI cover the user sent (illustrated panels, huge centred logo
overlapping the seams, corner badge), v2 rebuilds the cover around the logo:
1. **Centred logo:** the block title now spans ~97% of the width and sits
   across the middle of the cover (baseline ~0.66H), overlapping the panel
   seams, with a soft dark halo behind it — instead of a bottom band. The
   neon script subtitle hangs below the title, overlapping its bottom edge.
2. **Hero layout:** new default layout `sunset-state` — a cinematic
   golden-hour hero (woman + convertible, full height, 56% wide) on the left
   and five distinct small panels on the right.
3. **No repeated photos:** panel photos are assigned without replacement
   (seeded shuffle; the default cover always shows six different samples).
   The near-duplicate `fisherman.jpg` (same man/pose as `pier.jpg`) was
   removed and replaced by a new model-made `speedboat.jpg` (speedboat at
   golden hour, 1200×800).
4. **Captions dodge the logo:** strips move to the top of any panel whose
   bottom falls under the logo band, and any strip that would still fall
   under the logo is skipped — so the logo never covers a caption.

## How the cover is drawn (cover.js: drawCover)
1. Dusk gradient backdrop; each layout panel is clipped with rounded corners and
   white edge light, then filled with its photo cover-fit at the panel's own
   zoom/offset, under a `ctx.filter` grade (saturate/contrast/sepia/hue-rotate)
   plus a soft-light sunset wash.
2. Panel caption strips (PLACE + time + tagline). Strips under the centred
   logo move to the top of the panel; strips that would still collide with
   the logo or the subtitle are skipped (computed from measured text).
3. Whole-cover sunset wash + vignette, soft dark halo behind the centred
   logo, subtle halftone in the logo band, seeded film grain.
4. Badges: starburst "EST. 2026" seal, "VOL. 06" pill, "WANTED ★★★★★" pill.
   (Our own seal — never Rockstar's "R" trademark.)
5. Block title: Anton, gradient white→gold→orange→pink, thick dark outline +
   pink shadow, auto-shrunk to fit ~97% of the width. Neon script subtitle:
   Pacifico, cyan/pink glow, tilted −2.6°, hanging below the title.
   Bottom tagline band.

## Layouts / grades / sizes
10 layouts (Sunset State 6 [default], Vice Grid 8, Hero + 3, Tilted Snaps 5,
Six Strip 6, Sunset Sleeve 5, Neon Nine 9, Duo + Trio 5, Full Bleed 3,
Collage Chaos 7), 5 grades (Sunset Blaze, Neon Vice, Golden Hour, Midnight
Pink, Teal Noir), 3 export sizes (1920×1080, 1080×1080, 1080×1350).

## Editor (main.js)
Click a panel to select it; drag to position the photo, scroll to zoom, zoom
slider, per-panel photo picker (6 samples + uploads via FileReader data URLs),
editable title/subtitle/tagline/captions, badges/captions/grain toggles,
undo/redo (40-step JSON snapshots), Surprise me (seeded random layout/grade/
photos/title, photos assigned without replacement), one-click PNG export per
size via an offscreen canvas.
URL params make shots deterministic: `?shot=cover|editor&layout=..&grade=..&
size=..&title=..&subtitle=..&sample=..&seed=..` (see shots.json).

## Screenshots
Taken with headless Chromium 157 driven over CDP (plain `--screenshot` exits
immediately on this build; localhost is also blocked by its Local Network
Access checks, so shots used `file://` URLs with `--allow-file-access-from-files`
plus a WebGL domain-policy file — the app itself makes no network requests).
1-cover.jpg: landscape Sunset State / Sunset Blaze. 2-editor.jpg: editor UI with
a photo loaded. 3-cover.jpg: story Neon Nine / Neon Vice. 4-cover.jpg: square
Tilted Snaps / Golden Hour. All viewed and iterated: v2 fixed the small bottom
title, the repeated fisherman photo, and captions colliding with the logo.

## Verification
`node --check` on both sources; `MAKEFUN_OUTPUT_DIR=out-test node main.ts`
twice, byte-identical; `node cli/makefun.mjs check --repo .` in the repo dir
(see final report for the result).
