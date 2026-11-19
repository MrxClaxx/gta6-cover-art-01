# METHOD — Neon Coast Cover Studio (gta6-cover-art-01)

## What it is
An offline browser app that turns any photo + caption into GTA-style cover art.
`app/index.html` + `app/style.css` + `app/src/cover.js` (canvas renderer) +
`app/src/main.js` (editor). No build step, no network at runtime: every file it
loads is under `app/` (vendored Anton + Pacifico TTFs with OFL texts, 6 sample
photos: 2 kit photos + 4 model-made).

## How the cover is drawn (cover.js: drawCover)
1. Dusk gradient backdrop; each layout panel is clipped with rounded corners and
   white edge light, then filled with its photo cover-fit at the panel's own
   zoom/offset, under a `ctx.filter` grade (saturate/contrast/sepia/hue-rotate)
   plus a soft-light sunset wash.
2. Panel caption strips (PLACE + time + tagline). Bottom-row captions move to the
   top of the panel so the title block never cuts them; captions that would
   collide with the neon subtitle are skipped (computed from measured text).
3. Whole-cover sunset wash + vignette, dark title gradient rising from the
   bottom, subtle halftone in the bottom band, seeded film grain.
4. Badges: starburst "EST. 2026" seal, "VOL. 06" pill, "WANTED ★★★★★" pill.
5. Block title: Anton, gradient white→gold→orange→pink, thick dark outline +
   pink shadow, auto-shrunk to fit. Neon script subtitle: Pacifico, cyan/pink
   glow, tilted −2.6°, overlapping the title. Bottom tagline band.

## Layouts / grades / sizes
9 layouts (Vice Grid 8, Hero + 3, Tilted Snaps 5, Six Strip 6, Sunset Sleeve 5,
Neon Nine 9, Duo + Trio 5, Full Bleed 3, Collage Chaos 7), 5 grades (Sunset
Blaze, Neon Vice, Golden Hour, Midnight Pink, Teal Noir), 3 export sizes
(1920×1080, 1080×1080, 1080×1350).

## Editor (main.js)
Click a panel to select it; drag to position the photo, scroll to zoom, zoom
slider, per-panel photo picker (6 samples + uploads via FileReader data URLs),
editable title/subtitle/tagline/captions, badges/captions/grain toggles,
undo/redo (40-step JSON snapshots), Surprise me (seeded random layout/grade/
photos/title), one-click PNG export per size via an offscreen canvas.
URL params make shots deterministic: `?shot=cover|editor&layout=..&grade=..&
size=..&title=..&subtitle=..&sample=..&seed=..` (see shots.json).

## Screenshots
Taken with headless Chromium 157 driven over CDP (plain `--screenshot` exits
immediately on this build; localhost is also blocked by its Local Network
Access checks, so shots used `file://` URLs with `--allow-file-access-from-files`
plus a WebGL domain-policy file — the app itself makes no network requests).
1-cover.jpg: landscape Vice Grid / Sunset Blaze. 2-editor.jpg: editor UI with a
photo loaded. 3-cover.jpg: story Neon Nine / Neon Vice. 4-cover.jpg: square
Tilted Snaps / Golden Hour. All viewed and iterated: fixed bottom captions being
cut by the title, halftone dots too strong, subtitle/caption collision on story.

## Verification
`node --check` on both sources; `MAKEFUN_OUTPUT_DIR=out-test node main.ts`;
`node cli/makefun.mjs check --kit . --repo <repo>` in the kit dir (see final
report for the result).
