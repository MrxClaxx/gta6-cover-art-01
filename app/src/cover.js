// Leonida Nights — cover renderer.
// Every piece of text lives in its own dedicated band or strip, never on top
// of a photo: the title band sits BELOW the hero image, the tagline lives
// inside that band, and each panel label sits in a solid strip BELOW its
// photo area. Faces can never be covered by text, whatever photo is loaded.

export const POSTER_SIZES = {
  portrait: { width: 1080, height: 1350, label: '1080 x 1350 portrait' },
  square: { width: 1080, height: 1080, label: '1080 x 1080 square' },
  wide: { width: 1920, height: 1080, label: '1920 x 1080 wide' },
};

export const DEFAULT_TITLE = 'LEONIDA NIGHTS';
export const DEFAULT_TAGLINE = 'Every sunset hides a story.';

export const SAMPLE_SCENES = [
  { id: 'ocean-drive', file: 'ocean-drive.jpg', label: 'OCEAN DRIVE', focus: { x: 0.47, y: 0.36 } },
  { id: 'bay-run', file: 'bay-run.jpg', label: 'THE BAY RUN', focus: { x: 0.45, y: 0.26 } },
  { id: 'rooftop-deal', file: 'rooftop-deal.jpg', label: 'ROOFTOP DEAL', focus: { x: 0.47, y: 0.32 } },
  { id: 'swamp-kings', file: 'swamp-kings.jpg', label: 'SWAMP KINGS', focus: { x: 0.47, y: 0.26 } },
  { id: 'neon-motel', file: 'neon-motel.jpg', label: 'NEON MOTEL', focus: { x: 0.47, y: 0.2 } },
];

export function createDefaultState() {
  return {
    title: DEFAULT_TITLE,
    tagline: DEFAULT_TAGLINE,
    panels: SAMPLE_SCENES.map((scene) => ({
      src: 'samples/' + scene.file,
      label: scene.label,
      focus: { x: scene.focus.x, y: scene.focus.y },
      zoom: 1,
      panX: 0,
      panY: 0,
    })),
  };
}

export function panelCount() {
  return 5;
}

// Geometry for one export size. Photos, the title band, the grid and the
// billing strip are separate rectangles that never overlap each other.
export function layoutFor(sizeKey) {
  const size = POSTER_SIZES[sizeKey] || POSTER_SIZES.portrait;
  const w = size.width;
  const h = size.height;
  const m = sizeKey === 'wide' ? 24 : 24;
  if (sizeKey === 'wide') {
    const hero = { x: 24, y: 24, width: 940, height: 760 };
    const gridX = 980;
    const gridY = 24;
    const cellW = 450;
    const cellH = 372;
    const gap = 16;
    const cells = [];
    for (let i = 0; i < 4; i++) {
      const cx = gridX + (i % 2) * (cellW + gap);
      const cy = gridY + Math.floor(i / 2) * (cellH + gap);
      cells.push({
        photo: { x: cx, y: cy, width: cellW, height: cellH - 60 },
        label: { x: cx, y: cy + cellH - 60, width: cellW, height: 60 },
      });
    }
    return {
      width: w,
      height: h,
      margin: m,
      hero,
      titleBand: { x: 24, y: 800, width: 1872, height: 180 },
      grid: cells,
      billing: { x: 24, y: 996, width: 1872, height: 60 },
    };
  }
  const inner = w - m * 2;
  if (sizeKey === 'square') {
    const hero = { x: m, y: 24, width: inner, height: 420 };
    const titleBand = { x: m, y: 456, width: inner, height: 150 };
    const gridY = 622;
    const gridH = 354;
    const cellW = (inner - 16) / 2;
    const cellH = (gridH - 16) / 2;
    const cells = [];
    for (let i = 0; i < 4; i++) {
      const cx = m + (i % 2) * (cellW + 16);
      const cy = gridY + Math.floor(i / 2) * (cellH + 16);
      cells.push({
        photo: { x: cx, y: cy, width: cellW, height: cellH - 48 },
        label: { x: cx, y: cy + cellH - 48, width: cellW, height: 48 },
      });
    }
    return { width: w, height: h, margin: m, hero, titleBand, grid: cells, billing: { x: m, y: 992, width: inner, height: 64 } };
  }
  const hero = { x: m, y: 24, width: inner, height: 560 };
  const titleBand = { x: m, y: 596, width: inner, height: 170 };
  const gridY = 782;
  const gridH = 458;
  const cellW = (inner - 16) / 2;
  const cellH = (gridH - 16) / 2;
  const cells = [];
  for (let i = 0; i < 4; i++) {
    const cx = m + (i % 2) * (cellW + 16);
    const cy = gridY + Math.floor(i / 2) * (cellH + 16);
    cells.push({
      photo: { x: cx, y: cy, width: cellW, height: cellH - 48 },
      label: { x: cx, y: cy + cellH - 48, width: cellW, height: 48 },
    });
  }
  return { width: w, height: h, margin: m, hero, titleBand, grid: cells, billing: { x: m, y: 1256, width: inner, height: 70 } };
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function drawPhoto(ctx, image, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  if (!image || !image.naturalWidth) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
    g.addColorStop(0, '#3b1d5e');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = '#ffd166';
    ctx.font = '700 ' + Math.round(rect.height * 0.14) + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
    return;
  }
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const zoom = panel.zoom || 1;
  const scale = Math.max(rect.width / iw, rect.height / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Anchor the crop on the panel focus point (usually the face), so the
  // face stays in frame at any crop aspect. Pan shifts from there.
  let dx = rect.x + rect.width / 2 - panel.focus.x * dw + (panel.panX || 0);
  let dy = rect.y + rect.height / 2 - panel.focus.y * dh + (panel.panY || 0);
  if (dw > rect.width) dx = clamp(dx, rect.x + rect.width - dw, rect.x);
  else dx = rect.x + (rect.width - dw) / 2;
  if (dh > rect.height) dy = clamp(dy, rect.y + rect.height - dh, rect.y);
  else dy = rect.y + (rect.height - dh) / 2;
  ctx.drawImage(image, dx, dy, dw, dh);
  // Warm sunset grade, only a whisper at the very bottom edge of the photo,
  // far from any face, plus a gold inner frame line.
  const grade = ctx.createLinearGradient(0, rect.y + rect.height * 0.82, 0, rect.y + rect.height);
  grade.addColorStop(0, 'rgba(255, 110, 60, 0)');
  grade.addColorStop(1, 'rgba(255, 110, 60, 0.16)');
  ctx.fillStyle = grade;
  ctx.fillRect(rect.x, rect.y + rect.height * 0.82, rect.width, rect.height * 0.18);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.width - 2, rect.height - 2);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  while (px > 12) {
    ctx.font = weight + ' ' + px + 'px ' + family;
    if (ctx.measureText(text).width <= maxWidth) return px;
    px -= 2;
  }
  return px;
}

function drawTitleBand(ctx, band, title, tagline, sizeKey) {
  const g = ctx.createLinearGradient(band.x, band.y, band.x + band.width, band.y + band.height);
  g.addColorStop(0, '#2a0a4a');
  g.addColorStop(0.5, '#7b1e5b');
  g.addColorStop(1, '#2a0a4a');
  ctx.fillStyle = g;
  ctx.fillRect(band.x, band.y, band.width, band.height);
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(band.x + 1, band.y + 1, band.width - 2, band.height - 2);
  const chipH = Math.round(band.height * 0.26);
  const chipPad = Math.round(band.width * 0.02);
  const chipFont = Math.round(chipH * 0.46);
  ctx.font = '800 ' + chipFont + 'px Arial, sans-serif';
  const chipPadX = Math.round(chipFont * 0.7);
  const leftChipW = ctx.measureText('VOL. 1').width + chipPadX * 2;
  const rightChipW = ctx.measureText('COMING SOON').width + chipPadX * 2;
  drawChip(ctx, band.x + chipPad, band.y + (band.height - chipH) / 2, 'VOL. 1', chipFont, chipH);
  drawChip(ctx, band.x + band.width - chipPad, band.y + (band.height - chipH) / 2, 'COMING SOON', chipFont, chipH, true);
  // The title is centred in the band, so its allowed width is twice the
  // distance from the centre to the nearer chip, minus a safety gap — a
  // title that merely fits "between the chips" would still run over one.
  const cx = band.x + band.width / 2;
  const halfGap = Math.min(
    cx - (band.x + chipPad + leftChipW),
    (band.x + band.width - chipPad - rightChipW) - cx
  ) - 24;
  const textW = Math.max(100, halfGap * 2);
  let titlePx = fitFont(ctx, title, textW, sizeKey === 'wide' ? 110 : 84, '"Arial Black", "Helvetica Neue", Arial, sans-serif', '900');
  ctx.font = '900 ' + titlePx + 'px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  try { ctx.letterSpacing = '2px'; } catch (e) { /* older canvas: no letter spacing */ }
  while (titlePx > 12 && ctx.measureText(title).width > textW) {
    titlePx -= 2;
    ctx.font = '900 ' + titlePx + 'px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  }
  const titleY = band.y + band.height * 0.46;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, titleY - titlePx * 0.6, 0, titleY + titlePx * 0.6);
  grad.addColorStop(0, '#fff7d6');
  grad.addColorStop(0.55, '#ffd166');
  grad.addColorStop(1, '#ff7a3d');
  ctx.lineWidth = Math.max(3, Math.round(titlePx * 0.09));
  ctx.strokeStyle = '#1a0529';
  ctx.strokeText(title, cx, titleY);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, titleY);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
  const tagPx = Math.round(band.height * 0.2);
  ctx.font = 'italic 600 ' + tagPx + 'px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#ffe9f3';
  ctx.fillText(tagline, cx, band.y + band.height * 0.82);
}

function drawChip(ctx, x, y, text, fontPx, height, alignRight) {
  ctx.font = '800 ' + fontPx + 'px Arial, sans-serif';
  const tw = ctx.measureText(text).width;
  const pad = Math.round(fontPx * 0.7);
  const w = tw + pad * 2;
  const bx = alignRight ? x - w : x;
  ctx.save();
  ctx.fillStyle = '#ffd166';
  ctx.strokeStyle = '#1a0529';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, y, w, height, height / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1a0529';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, y + height / 2 + 1);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLabelStrip(ctx, strip, label) {
  ctx.fillStyle = '#160a24';
  ctx.fillRect(strip.x, strip.y, strip.width, strip.height);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(strip.x, strip.y, strip.width, 3);
  const px = fitFont(ctx, label, strip.width - 24, Math.round(strip.height * 0.52), 'Arial, sans-serif', '800');
  ctx.font = '800 ' + px + 'px Arial, sans-serif';
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '3px'; } catch (e) { /* ignore */ }
  ctx.fillText(label, strip.x + strip.width / 2, strip.y + strip.height / 2 + 2);
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function drawBarcode(ctx, x, y, w, h, seedText) {
  let seed = hashSeed(seedText || 'LEONIDA');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let cx = x + 4;
  while (cx < x + w - 6) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const bw = 2 + (seed % 3) * 2;
    if ((seed >> 8) % 3 !== 0) ctx.fillRect(cx, y + 3, bw, h - 6);
    cx += bw + 2 + (seed % 2);
  }
}

function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ff5e8a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff3d6';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 ' + Math.round(r * 0.42) + 'px Arial, sans-serif';
  ctx.fillText('VOL. 1', cx, cy - r * 0.18);
  ctx.font = '700 ' + Math.round(r * 0.26) + 'px Arial, sans-serif';
  ctx.fillText('ORIGINAL', cx, cy + r * 0.32);
  ctx.restore();
}

function drawBilling(ctx, strip, title) {
  ctx.fillStyle = '#0d0618';
  ctx.fillRect(strip.x, strip.y, strip.width, strip.height);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(strip.x, strip.y, strip.width, 2);
  const sealR = Math.round(strip.height * 0.42);
  const sealCx = strip.x + strip.width - sealR - 8;
  const sealCy = strip.y + strip.height / 2;
  const barcodeW = Math.round(strip.width * 0.14);
  const barcodeX = sealCx - sealR - barcodeW - 18;
  drawBarcode(ctx, barcodeX, strip.y + 10, barcodeW, strip.height - 20, title);
  ctx.fillStyle = '#cbb8e8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const px = Math.round(strip.height * 0.26);
  ctx.font = '600 ' + px + 'px Arial, sans-serif';
  ctx.fillText('A LEONIDA NIGHTS PRODUCTION', strip.x + 8, strip.y + strip.height * 0.32);
  ctx.font = '400 ' + px + 'px Arial, sans-serif';
  ctx.fillText('ORIGINAL COVER ART  •  NOT AFFILIATED WITH ROCKSTAR GAMES', strip.x + 8, strip.y + strip.height * 0.72);
  drawSeal(ctx, sealCx, sealCy, sealR);
}

// Draw the whole poster. `images` lines up with state.panels; a missing
// image draws the empty-photo placeholder instead of failing.
export function drawCover(ctx, state, sizeKey, images) {
  const layout = layoutFor(sizeKey);
  const bg = ctx.createLinearGradient(0, 0, layout.width, layout.height);
  bg.addColorStop(0, '#1c0b33');
  bg.addColorStop(0.55, '#12081f');
  bg.addColorStop(1, '#0b0616');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, layout.width, layout.height);
  drawPhoto(ctx, images ? images[0] : null, layout.hero, state.panels[0]);
  drawTitleBand(ctx, layout.titleBand, state.title || DEFAULT_TITLE, state.tagline || DEFAULT_TAGLINE, sizeKey);
  for (let i = 0; i < 4; i++) {
    const cell = layout.grid[i];
    const panel = state.panels[i + 1];
    drawPhoto(ctx, images ? images[i + 1] : null, cell.photo, panel);
    drawLabelStrip(ctx, cell.label, panel.label || SAMPLE_SCENES[i + 1].label);
  }
  drawBilling(ctx, layout.billing, state.title || DEFAULT_TITLE);
  return layout;
}

export function renderCoverToCanvas(state, sizeKey, images) {
  const size = POSTER_SIZES[sizeKey] || POSTER_SIZES.portrait;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, state, sizeKey, images);
  return canvas;
}
