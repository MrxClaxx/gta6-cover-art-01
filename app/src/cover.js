// Neon Coast Cover Studio — cover renderer (v2: centred-logo treatment).
// Draws a dense multi-panel GTA-style poster cover on a 2D canvas:
// photo panels with per-panel crop/position, sunset/neon grades,
// a HUGE gradient block title centred over the panel grid like the official
// GTA VI cover (logo overlapping the panel seams) + neon script subtitle,
// panel captions, badges, tagline band, grain, halftone and vignette.
// Every photo is local (samples/ or a user upload); nothing is fetched.
// v2 changes: new default layout 'sunset-state' (cinematic golden-hour hero
// left, full height, + 5 distinct small panels right); the title is now a
// centred logo spanning ~97% of the width at ~0.66H instead of a bottom
// band; the near-duplicate 'fisherman' sample was replaced by 'speedboat',
// so the default cover never repeats a photo.

export const SAMPLES = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard' },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier' },
  { id: 'tower', src: 'samples/tower.jpg', label: 'Lifeguard' },
  { id: 'marina', src: 'samples/marina.jpg', label: 'Marina' },
  { id: 'rooftop', src: 'samples/rooftop.jpg', label: 'Rooftop' },
  { id: 'speedboat', src: 'samples/speedboat.jpg', label: 'Speedboat' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset Blaze', filter: 'saturate(1.45) contrast(1.1) sepia(0.28) brightness(1.04)', wash: ['#ff7a18', '#ff2e88'], washAlpha: 0.22 },
  { id: 'neon', name: 'Neon Vice', filter: 'saturate(1.75) contrast(1.14) hue-rotate(-12deg) brightness(1.02)', wash: ['#00e5ff', '#ff2e88'], washAlpha: 0.24 },
  { id: 'golden', name: 'Golden Hour', filter: 'sepia(0.42) saturate(1.5) contrast(1.05) brightness(1.08)', wash: ['#ffc93c', '#ff7a18'], washAlpha: 0.2 },
  { id: 'midnight', name: 'Midnight Pink', filter: 'saturate(1.3) contrast(1.16) brightness(0.92) hue-rotate(8deg)', wash: ['#7b2fff', '#ff2e88'], washAlpha: 0.26 },
  { id: 'teal', name: 'Teal Noir', filter: 'saturate(1.35) contrast(1.18) brightness(0.95) hue-rotate(24deg)', wash: ['#00c2a8', '#ff7a18'], washAlpha: 0.2 },
];

// Layouts: panels as [x, y, w, h] fractions of the cover, plus optional rotation (deg).
// 'sunset-state' is the default: a cinematic golden-hour hero on the left, full
// height, with five distinct small panels on the right — the title logo overlaps
// the panel seams across the middle, like the official GTA VI cover.
export const LAYOUTS = [
  { id: 'sunset-state', name: 'Sunset State · 6', panels: [[0, 0, .56, 1], [.57, 0, .21, .30], [.79, 0, .21, .30], [.57, .31, .43, .30], [.57, .62, .21, .38], [.79, .62, .21, .38]] },
  { id: 'vice-grid', name: 'Vice Grid · 8', panels: [[0, 0, .44, .58], [.45, 0, .27, .28], [.73, 0, .27, .28], [.45, .29, .27, .29], [.73, .29, .27, .29], [0, .59, .32, .41], [.33, .59, .33, .41], [.67, .59, .33, .41]] },
  { id: 'hero-three', name: 'Hero + 3', panels: [[0, 0, .6, 1], [.61, 0, .39, .32], [.61, .33, .39, .33], [.61, .67, .39, .33]] },
  { id: 'tilted', name: 'Tilted Snaps · 5', panels: [[0, .02, .46, .52, -2], [.47, 0, .53, .46, 2], [0, .55, .32, .45, 1.5], [.33, .53, .34, .47, -1.5], [.68, .55, .32, .45, 2]] },
  { id: 'six-strip', name: 'Six Strip · 6', panels: [[0, 0, .33, .49], [.335, 0, .33, .49], [.67, 0, .33, .49], [0, .5, .33, .5], [.335, .5, .33, .5], [.67, .5, .33, .5]] },
  { id: 'sleeve', name: 'Sunset Sleeve · 5', panels: [[0, 0, .38, 1], [.39, 0, .3, .49], [.7, 0, .3, .49], [.39, .5, .3, .5], [.7, .5, .3, .5]] },
  { id: 'neon-nine', name: 'Neon Nine · 9', panels: [[0, 0, .33, .33], [.335, 0, .33, .33], [.67, 0, .33, .33], [0, .335, .33, .33], [.335, .335, .33, .33], [.67, .335, .33, .33], [0, .67, .33, .33], [.335, .67, .33, .33], [.67, .67, .33, .33]] },
  { id: 'duo-trio', name: 'Duo + Trio · 5', panels: [[0, 0, .49, .55], [.5, 0, .5, .55], [0, .56, .33, .44], [.335, .56, .33, .44], [.67, .56, .33, .44]] },
  { id: 'full-bleed', name: 'Full Bleed · 3', panels: [[0, 0, 1, .66], [0, .67, .49, .33], [.5, .67, .5, .33]] },
  { id: 'chaos', name: 'Collage Chaos · 7', panels: [[0, 0, .3, .62], [.31, 0, .38, .3], [.7, 0, .3, .44], [.31, .31, .38, .31], [.7, .45, .3, .55], [0, .63, .34, .37], [.35, .63, .34, .37]] },
];

export const SIZES = [
  { id: 'landscape', name: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
  { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'story', name: 'Story 1080 × 1350', w: 1080, h: 1350 },
];

export const CAPTIONS = [
  { place: 'MARINA DEL SOL', time: '7:40 PM', tag: 'NO WITNESSES' },
  { place: 'OCEAN DRIVE', time: '6:12 PM', tag: 'GOLDEN HOUR' },
  { place: 'VICE CITY', time: '11:58 PM', tag: 'NEON RUNS' },
  { place: 'LEONIDA KEYS', time: '5:47 AM', tag: 'LAST CAST' },
  { place: 'STARFISH ISLAND', time: '9:03 PM', tag: 'ROOFTOP DEAL' },
  { place: 'LIFEGUARD ROW', time: '4:20 PM', tag: 'HIGH TIDE' },
  { place: 'MALIBU CLUB', time: '1:15 AM', tag: 'NO COVER' },
  { place: 'SUNSET STRIP', time: '8:30 PM', tag: 'ENGINE RUNNING' },
  { place: 'PORT VICE', time: '3:33 AM', tag: 'CARGO ONLY' },
];

export function layoutPanels(layoutId, W, H) {
  const lay = LAYOUTS.find((l) => l.id === layoutId) || LAYOUTS[0];
  const g = Math.max(4, Math.round(Math.min(W, H) * 0.007));
  return lay.panels.map(([fx, fy, fw, fh, rot = 0]) => ({
    x: fx * W + (fx > 0 ? g / 2 : 0), y: fy * H + (fy > 0 ? g / 2 : 0),
    w: fw * W - g, h: fh * H - g, rot,
  }));
}

export function panelAt(layoutId, W, H, px, py) {
  const panels = layoutPanels(layoutId, W, H);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}

function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function fitTitleFont(ctx, text, maxW, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxW) { px -= 4; ctx.font = `${px}px ${family}`; }
  return px;
}

function drawPhotoCover(ctx, img, p, crop) {
  const z = crop.zoom || 1, ox = crop.ox || 0, oy = crop.oy || 0;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(p.w / iw, p.h / ih) * z;
  const dw = iw * scale, dh = ih * scale;
  const dx = p.x + (p.w - dw) / 2 + ox * p.w, dy = p.y + (p.h - dh) / 2 + oy * p.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawCaptionStrip(ctx, p, cap, W, H, zoneTop) {
  if (!cap) return;
  const fs = Math.max(11, Math.round(W * 0.011));
  const pad = Math.round(W * 0.008);
  ctx.save();
  ctx.font = `700 ${fs}px Arial, sans-serif`;
  const line1 = cap.place, line2 = `${cap.time}  ·  ${cap.tag}`;
  const w1 = ctx.measureText(line1).width, w2 = ctx.measureText(line2).width;
  const bw = Math.max(w1, w2) + pad * 2, bh = fs * 2 + pad * 1.7;
  const bx = p.x + Math.round(W * 0.006);
  // Panels whose bottom sits under the centred title logo get their caption
  // at the top, so the logo never covers a caption strip.
  const by = (p.y + p.h > zoneTop)
    ? p.y + Math.round(W * 0.006)
    : p.y + p.h - bh - Math.round(W * 0.006);
  ctx.fillStyle = 'rgba(10,4,20,0.82)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(bx, by, Math.max(3, W * 0.002), bh);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';
  ctx.fillText(line1, bx + pad, by + pad * 0.7);
  ctx.fillStyle = '#ffb3c8';
  ctx.font = `600 ${Math.round(fs * 0.82)}px Arial, sans-serif`;
  ctx.fillText(line2, bx + pad, by + pad * 0.7 + fs * 1.05);
  ctx.restore();
}

function drawStarburst(ctx, cx, cy, r, label, sub, W) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.78, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeStyle = '#14061f';
  ctx.stroke();
  ctx.fillStyle = '#14061f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(r * 0.34)}px Anton, sans-serif`;
  ctx.fillText(label, 0, -r * 0.12);
  ctx.font = `700 ${Math.round(r * 0.2)}px Arial, sans-serif`;
  ctx.fillText(sub, 0, r * 0.28);
  ctx.restore();
}

function drawPill(ctx, x, y, text, W, fill, fg) {
  ctx.save();
  const fs = Math.max(12, Math.round(W * 0.013));
  ctx.font = `800 ${fs}px Arial, sans-serif`;
  const tw = ctx.measureText(text).width, pad = fs * 0.9, h = fs * 2.1;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, tw + pad * 2, h, h / 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, W * 0.0015);
  ctx.strokeStyle = fg;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 + 1);
  ctx.restore();
  return tw + pad * 2;
}

function drawHalftone(ctx, x, y, w, h, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  const step = Math.max(9, Math.round(w / 60));
  for (let yy = y; yy < y + h; yy += step) {
    for (let xx = x; xx < x + w; xx += step) {
      const a = 0.02 + rnd() * 0.07;
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(xx, yy, Math.max(1, step * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, W, H, seed) {
  const rnd = seededRandom(seed);
  ctx.save();
  const n = Math.round((W * H) / 900);
  for (let i = 0; i < n; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(0.03 + rnd() * 0.05).toFixed(2)})` : `rgba(0,0,0,${(0.03 + rnd() * 0.06).toFixed(2)})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  ctx.restore();
}

// state: { layout, grade, size, title, subtitle, tagline, panels:[{photo, zoom, ox, oy, caption}], badges, grain }
// images: Map photoId -> HTMLImageElement. Missing photos fall back to a sunset gradient.
export function drawCover(ctx, state, W, H, images) {
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  const panels = layoutPanels(state.layout, W, H);
  const g = Math.max(4, Math.round(Math.min(W, H) * 0.007));

  // Dusk backdrop.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b0b3b'); bg.addColorStop(0.45, '#4b1158'); bg.addColorStop(0.75, '#c22a6b'); bg.addColorStop(1, '#ff7a18');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Centred-logo metrics: the block title spans ~97% of the width and sits
  // across the middle of the cover, overlapping the panel seams like the
  // official GTA VI cover; the neon script subtitle hangs below it.
  const title = (state.title || 'SUNSET HEIST').toUpperCase();
  const sub = state.subtitle || 'Vice City nights';
  const titlePx = fitTitleFont(ctx, title, W * 0.97, Math.round(H * 0.30), 'Anton, sans-serif');
  const titleY = Math.round(H * 0.66);
  const subPx = Math.max(20, Math.round(titlePx * 0.42));
  ctx.save();
  ctx.font = `${subPx}px Pacifico, cursive`;
  const subW = ctx.measureText(sub).width;
  ctx.restore();
  const titleZoneTop = titleY - Math.round(titlePx * 0.78);
  const titleRect = { x: Math.round(W * 0.015), y: titleZoneTop, w: Math.round(W * 0.97), h: Math.round(titlePx * 0.85 + subPx * 1.1) };
  const subRect = { x: W / 2 - subW / 2 - 10, y: titleY + Math.round(subPx * 0.1), w: subW + 20, h: Math.round(subPx * 1.25) };
  // A caption strip is skipped when its y-range would fall under the logo
  // (the logo spans nearly the full width, so any strip in its band collides).
  const captionHidden = (p) => {
    if (state.captions === false) return true;
    const fs = Math.max(11, Math.round(W * 0.011));
    const pad = Math.round(W * 0.008);
    const stripH = fs * 2 + pad * 1.7 + 12;
    const stripY = (p.y + p.h > titleZoneTop)
      ? p.y + Math.round(W * 0.006)
      : p.y + p.h - stripH - Math.round(W * 0.006);
    const overlaps = (a0, a1, b0, b1) => a0 < b1 && a1 > b0;
    return overlaps(stripY, stripY + stripH, titleRect.y, titleRect.y + titleRect.h)
      || overlaps(stripY, stripY + stripH, subRect.y, subRect.y + subRect.h);
  };

  // Photo panels.
  panels.forEach((p, i) => {
    const pc = state.panels[i] || {};
    const img = images.get(pc.photo);
    ctx.save();
    if (p.rot) { ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2)); }
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, Math.max(4, W * 0.006));
    ctx.clip();
    if (img) {
      ctx.filter = grade.filter;
      drawPhotoCover(ctx, img, p, pc);
      ctx.filter = 'none';
    } else {
      const pg = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      pg.addColorStop(0, '#ff7a18'); pg.addColorStop(1, '#ff2e88');
      ctx.fillStyle = pg; ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    // Warm grade wash per panel + inner edge light.
    ctx.fillStyle = grade.wash[0]; ctx.globalAlpha = 0.08; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, W * 0.0022);
    ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
    ctx.restore();
    if (!captionHidden(p)) drawCaptionStrip(ctx, p, pc.caption || CAPTIONS[i % CAPTIONS.length], W, H, titleZoneTop);
  });

  // Sunset wash + vignette over the whole cover.
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, grade.wash[0]); wash.addColorStop(1, grade.wash[1]);
  ctx.save(); ctx.globalAlpha = grade.washAlpha * 0.55; ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H); ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(10,2,24,0.5)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  // Soft dark halo behind the centred logo so it reads over the photos,
  // plus a whisper of halftone in the logo band.
  const halo = ctx.createRadialGradient(W / 2, titleY - titlePx * 0.2, Math.min(W, H) * 0.08, W / 2, titleY - titlePx * 0.2, Math.max(W, H) * 0.62);
  halo.addColorStop(0, 'rgba(12,2,28,0.5)'); halo.addColorStop(0.6, 'rgba(12,2,28,0.26)'); halo.addColorStop(1, 'rgba(12,2,28,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
  drawHalftone(ctx, 0, titleZoneTop, W, titlePx * 0.9 + subPx, 7);

  // Badges (top-right cluster).
  if (state.badges !== false) {
    const r = Math.max(30, W * 0.038);
    drawStarburst(ctx, W - r - g * 2, r + g * 2, r, 'EST.', '2026', W);
    drawPill(ctx, W - r * 2 - g * 4 - Math.round(W * 0.075), r + g, 'VOL. 06', W, 'rgba(12,2,28,0.85)', '#ffd23f');
    drawPill(ctx, g * 2, g * 2, 'WANTED  ★★★★★', W, '#ff2e63', '#fff');
  }

  // Centred logo: gradient block title, thick dark outline + pink shadow.
  ctx.save();
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const grad = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY + titlePx * 0.1);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.45, '#ffd23f'); grad.addColorStop(0.75, '#ff7a18'); grad.addColorStop(1, '#ff2e88');
  ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = Math.round(W * 0.012); ctx.shadowOffsetY = Math.round(W * 0.004);
  ctx.lineWidth = Math.max(4, titlePx * 0.09); ctx.strokeStyle = '#160420'; ctx.lineJoin = 'round';
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.strokeText(title, W / 2, titleY);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = grad; ctx.fillText(title, W / 2, titleY);
  ctx.restore();

  // Neon script subtitle, tilted, hanging below the block title.
  ctx.save();
  ctx.translate(W / 2, titleY + Math.round(subPx * 0.55));
  ctx.rotate(-0.045);
  ctx.textAlign = 'center';
  ctx.font = `${subPx}px Pacifico, cursive`;
  ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = Math.round(W * 0.014);
  ctx.fillStyle = '#7df9ff';
  ctx.fillText(sub, 0, 0);
  ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = Math.round(W * 0.008);
  ctx.fillStyle = '#ffd7ef';
  ctx.fillText(sub, 0, 0);
  ctx.restore();

  // Bottom tagline band.
  const tag = state.tagline || 'EVERY SUNSET HAS A PRICE  •  LEONIDA, 2026';
  const bandH = Math.max(26, Math.round(H * 0.042));
  ctx.fillStyle = '#14061f';
  ctx.fillRect(0, H - bandH, W, bandH);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, H - bandH, W, Math.max(2, H * 0.003));
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(bandH * 0.42)}px Arial, sans-serif`;
  ctx.fillText(tag.toUpperCase(), W / 2, H - bandH / 2 + 1);

  if (state.grain !== false) drawGrain(ctx, W, H, 20261119);
}
