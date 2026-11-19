// cover.js — canvas cover renderer for Neon Coast Cover Studio (v4, fresh rewrite).
// Draws GTA-style poster covers: photo panels, a giant gradient title that
// overlaps the panel seams, a neon script line, badges and a tagline band.
// No Rockstar assets anywhere: the lettering is original Anton + Pacifico
// (SIL OFL, in app/fonts), every photo is model-made for this entry.

(function () {
  'use strict';

  // ------------------------------------------------------------------ data

  var SAMPLE_PHOTOS = [
    { id: 'hero', src: 'samples/hero.jpg', label: 'Golden Hour' },
    { id: 'tower', src: 'samples/tower.jpg', label: 'Lifeguard' },
    { id: 'marina', src: 'samples/marina.jpg', label: 'Neon Marina' },
    { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Ocean Drive' },
    { id: 'speedboat', src: 'samples/speedboat.jpg', label: 'Full Throttle' },
    { id: 'pier', src: 'samples/pier.jpg', label: 'Pier 9' }
  ];

  var DEFAULT_CAPTIONS = [
    { caption: '', sub: '' },
    { caption: 'OCEAN DRIVE', sub: '6:12 PM · GOLDEN HOUR' },
    { caption: 'VICE CITY', sub: '11:58 PM · NEON RUNS' },
    { caption: 'COLONY HOTEL', sub: 'OCEAN DRIVE · 7:40 PM' },
    { caption: 'FULL THROTTLE', sub: '7:03 PM · OPEN WATER' },
    { caption: 'PIER 9', sub: 'DAWN PATROL · 5:47 AM' }
  ];

  var GRADES = [
    { id: 'sunset', name: 'Sunset', filter: 'saturate(1.25) contrast(1.05)',
      overlay: '#ff7a18', overlayAlpha: 0.10, overlayMode: 'overlay',
      titleTop: '#fff3b0', titleMid: '#ffb347', titleBottom: '#ff5e62',
      script: '#ff9ff3', glow: '#ff2fb3' },
    { id: 'neon', name: 'Neon', filter: 'saturate(1.5) contrast(1.1)',
      overlay: '#ff2fb3', overlayAlpha: 0.12, overlayMode: 'soft-light',
      titleTop: '#fdfd96', titleMid: '#ff9de2', titleBottom: '#b967ff',
      script: '#7df9ff', glow: '#00e5ff' },
    { id: 'vice', name: 'Vice', filter: 'saturate(1.35)',
      overlay: '#7b2fff', overlayAlpha: 0.14, overlayMode: 'overlay',
      titleTop: '#ffe259', titleMid: '#ff7e5f', titleBottom: '#ff2e63',
      script: '#ff8fd1', glow: '#ff2e63' },
    { id: 'dusk', name: 'Dusk', filter: 'saturate(1.1) brightness(0.95) contrast(1.08)',
      overlay: '#1a2a6c', overlayAlpha: 0.16, overlayMode: 'overlay',
      titleTop: '#ffd194', titleMid: '#ff8c42', titleBottom: '#e94057',
      script: '#ffd166', glow: '#ff8c42' },
    { id: 'noir', name: 'Noir', filter: 'grayscale(0.85) contrast(1.25) brightness(1.05)',
      overlay: '#000000', overlayAlpha: 0.08, overlayMode: 'multiply',
      titleTop: '#ffffff', titleMid: '#ffd166', titleBottom: '#ff6b6b',
      script: '#ffffff', glow: '#ffd166' }
  ];

  var SIZES = {
    landscape: { w: 1920, h: 1080, label: 'Landscape 1920 × 1080' },
    square: { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
    story: { w: 1080, h: 1350, label: 'Story 1080 × 1350' }
  };

  var TITLES = [
    { title: 'SUNSET HEIST', script: 'Vice City nights' },
    { title: 'NEON COAST', script: 'Ocean Drive after dark' },
    { title: 'VICE ROYALE', script: 'Chasing the last light' },
    { title: 'GOLDEN GETAWAY', script: 'Where the sun never sets' },
    { title: 'LEONIDA NIGHTS', script: 'Every sunset has a price' },
    { title: 'PALM SHADOWS', script: 'Neon runs till dawn' }
  ];

  // -------------------------------------------------------------- layouts
  // Every layout is a function of (w, h) returning panel rects plus the
  // script zone: a rectangle over sky or water where the neon script may
  // sit without ever crossing a face. The title band and the script zone
  // are placed by the layout, never guessed at draw time.

  function gutter(w) { return Math.max(6, Math.round(w * 0.008)); }
  function band(h) { return Math.round(h * 0.06); }

  function sunsetState(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var heroW = Math.round(w * 0.56);
    var rx = heroW + g, rw = w - rx;
    var cw = Math.floor((rw - g) / 2);
    var rh = Math.floor((body - 2 * g) / 3);
    return {
      slots: 6,
      panels: [
        { x: 0, y: 0, w: heroW, h: body },
        { x: rx, y: 0, w: cw, h: rh },
        { x: rx + cw + g, y: 0, w: rw - cw - g, h: rh },
        { x: rx, y: rh + g, w: rw, h: rh },
        { x: rx, y: 2 * (rh + g), w: cw, h: body - 2 * (rh + g) },
        { x: rx + cw + g, y: 2 * (rh + g), w: rw - cw - g, h: body - 2 * (rh + g) }
      ],
      // Sky of the speedboat panel: top strip of the bottom-middle panel.
      scriptZone: { x: Math.round(w * 0.30), y: 2 * (rh + g) + Math.round(rh * 0.03),
                    w: rx + cw - Math.round(w * 0.30), h: Math.round(rh * 0.30) },
      titleY: 0.66
    };
  }

  function neonGrid(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var cw = Math.floor((w - 2 * g) / 3), rh = Math.floor((body - g) / 2);
    var panels = [];
    for (var r = 0; r < 2; r++) {
      for (var c = 0; c < 3; c++) {
        panels.push({ x: c * (cw + g), y: r * (rh + g), w: cw, h: rh });
      }
    }
    return {
      slots: 6, panels: panels,
      // Sky of the bottom-middle panel (speedboat): the script sits there,
      // clear of the title above it and of any face.
      scriptZone: { x: cw + g + Math.round(cw * 0.05), y: rh + g + Math.round(rh * 0.04),
                    w: Math.round(cw * 0.9), h: Math.round(rh * 0.26) },
      titleY: 0.52
    };
  }

  function heroSide(w, h, flip) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var heroW = Math.round(w * 0.5);
    var sx = flip ? 0 : heroW + g, sw = w - heroW - g;
    var hx = flip ? heroW + g : 0;
    var rh = Math.floor((body - 3 * g) / 4);
    var panels = [{ x: hx, y: 0, w: heroW, h: body }];
    for (var i = 0; i < 4; i++) {
      panels.push({ x: sx, y: i * (rh + g), w: sw, h: rh });
    }
    return {
      slots: 5, panels: panels,
      // Sky of the bottom side panel (speedboat), below the title.
      scriptZone: { x: sx + Math.round(sw * 0.05), y: 3 * (rh + g) + Math.round(rh * 0.04),
                    w: Math.round(sw * 0.9), h: Math.round(rh * 0.26) },
      titleY: 0.60
    };
  }

  function triptych(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var cw = Math.floor((w - 2 * g) / 3);
    return {
      slots: 3,
      panels: [
        { x: 0, y: 0, w: cw, h: body },
        { x: cw + g, y: 0, w: cw, h: body },
        { x: 2 * (cw + g), y: 0, w: w - 2 * (cw + g), h: body }
      ],
      scriptZone: { x: Math.round(w * 0.25), y: Math.round(body * 0.70),
                    w: Math.round(w * 0.50), h: Math.round(body * 0.12) },
      titleY: 0.58
    };
  }

  function quad(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var cw = Math.floor((w - g) / 2), rh = Math.floor((body - g) / 2);
    return {
      slots: 4,
      panels: [
        { x: 0, y: 0, w: cw, h: rh },
        { x: cw + g, y: 0, w: w - cw - g, h: rh },
        { x: 0, y: rh + g, w: cw, h: body - rh - g },
        { x: cw + g, y: rh + g, w: w - cw - g, h: body - rh - g }
      ],
      // Sky of the bottom-left panel (marina), below the title.
      scriptZone: { x: Math.round(w * 0.05), y: rh + g + Math.round(rh * 0.05),
                    w: Math.round(cw * 0.85), h: Math.round(rh * 0.26) },
      titleY: 0.55
    };
  }

  function strip(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var topH = Math.floor(body * 0.62), botH = body - topH - g;
    var cw = Math.floor((w - 2 * g) / 3);
    return {
      slots: 4,
      panels: [
        { x: 0, y: 0, w: w, h: topH },
        { x: 0, y: topH + g, w: cw, h: botH },
        { x: cw + g, y: topH + g, w: cw, h: botH },
        { x: 2 * (cw + g), y: topH + g, w: w - 2 * (cw + g), h: botH }
      ],
      // Sky of the bottom-middle panel (marina), below the title.
      scriptZone: { x: cw + g + Math.round(cw * 0.05), y: topH + g + Math.round(botH * 0.04),
                    w: Math.round(cw * 0.9), h: Math.round(botH * 0.26) },
      titleY: 0.50
    };
  }

  function collage9(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var cw = Math.floor((w - 2 * g) / 3), rh = Math.floor((body - 2 * g) / 3);
    var panels = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        panels.push({ x: c * (cw + g), y: r * (rh + g), w: cw, h: rh });
      }
    }
    return {
      slots: 9, panels: panels,
      // Water of the centre panel (speedboat), below the title.
      scriptZone: { x: cw + g + Math.round(cw * 0.05), y: rh + g + Math.round(rh * 0.68),
                    w: Math.round(cw * 0.9), h: Math.round(rh * 0.26) },
      titleY: 0.50
    };
  }

  function portraitHero(w, h) {
    var g = gutter(w), tb = band(h), body = h - tb;
    var topH = Math.floor(body * 0.62), botH = body - topH - g;
    var cw = Math.floor((w - g) / 2);
    return {
      slots: 3,
      panels: [
        { x: 0, y: 0, w: w, h: topH },
        { x: 0, y: topH + g, w: cw, h: botH },
        { x: cw + g, y: topH + g, w: w - cw - g, h: botH }
      ],
      // Sky of the bottom-left panel (lifeguard tower), below the title.
      scriptZone: { x: Math.round(w * 0.03), y: topH + g + Math.round(botH * 0.04),
                    w: Math.round(w * 0.45), h: Math.round(botH * 0.26) },
      titleY: 0.52
    };
  }

  function single(w, h) {
    var tb = band(h);
    return {
      slots: 1,
      panels: [{ x: 0, y: 0, w: w, h: h - tb }],
      // Sky band at the top of a full-bleed photo.
      scriptZone: { x: Math.round(w * 0.25), y: Math.round((h - tb) * 0.06),
                    w: Math.round(w * 0.50), h: Math.round((h - tb) * 0.12) },
      titleY: 0.72
    };
  }

  function tilted(w, h) {
    // Square-first collage: a big tilted centre panel with four corner panels.
    var g = gutter(w), tb = band(h), body = h - tb;
    var cw = Math.floor((w - 2 * g) / 3), rh = Math.floor((body - 2 * g) / 3);
    var panels = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue;
        panels.push({ x: c * (cw + g), y: r * (rh + g), w: cw, h: rh });
      }
    }
    panels.push({ x: cw + g - Math.round(cw * 0.08), y: rh + g - Math.round(rh * 0.08),
                  w: Math.round(cw * 1.16), h: Math.round(rh * 1.16), tilt: -4 });
    var cx = cw + g - Math.round(cw * 0.08), cy = rh + g - Math.round(rh * 0.08);
    var cwid = Math.round(cw * 1.16), chgt = Math.round(rh * 1.16);
    return {
      slots: 9, panels: panels,
      // Water of the tilted centre panel, below the title.
      scriptZone: { x: cx + Math.round(cwid * 0.05), y: cy + Math.round(chgt * 0.68),
                    w: Math.round(cwid * 0.9), h: Math.round(chgt * 0.26) },
      titleY: 0.50
    };
  }

  var LAYOUTS = [
    { id: 'sunset-state', name: 'Sunset State', build: sunsetState },
    { id: 'neon-grid', name: 'Neon Grid', build: neonGrid },
    { id: 'hero-left', name: 'Hero Left', build: function (w, h) { return heroSide(w, h, false); } },
    { id: 'hero-right', name: 'Hero Right', build: function (w, h) { return heroSide(w, h, true); } },
    { id: 'triptych', name: 'Triptych', build: triptych },
    { id: 'quad', name: 'Quad', build: quad },
    { id: 'strip', name: 'Strip', build: strip },
    { id: 'collage-9', name: 'Collage 9', build: collage9 },
    { id: 'portrait-hero', name: 'Portrait Hero', build: portraitHero },
    { id: 'single', name: 'Single Shot', build: single },
    { id: 'tilted', name: 'Tilted', build: tilted }
  ];

  // ---------------------------------------------------------------- helpers

  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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

  function fitFont(ctx, text, maxWidth, startPx, family, weight) {
    var px = startPx;
    ctx.font = weight + ' ' + px + 'px ' + family;
    while (px > 12 && ctx.measureText(text).width > maxWidth) {
      px -= 2;
      ctx.font = weight + ' ' + px + 'px ' + family;
    }
    return px;
  }

  // Where does a panel's caption strip go? Bottom first; if the title box
  // would cover it (within 24px), move it to the top; if both are covered,
  // the panel gets no strip at all. Nothing ever hides behind the title.
  function captionPlacement(panel, titleBox, stripH, pad, scale) {
    var clear = 16 * scale;
    var bottom = { x: panel.x + pad, y: panel.y + panel.h - stripH - pad,
                   w: panel.w - 2 * pad, h: stripH };
    var top = { x: panel.x + pad, y: panel.y + pad, w: panel.w - 2 * pad, h: stripH };
    function overlaps(r) {
      return r.x < titleBox.x + titleBox.w + clear && r.x + r.w > titleBox.x - clear &&
             r.y < titleBox.y + titleBox.h + clear && r.y + r.h > titleBox.y - clear;
    }
    if (!overlaps(bottom)) return { rect: bottom, side: 'bottom' };
    if (!overlaps(top)) return { rect: top, side: 'top' };
    return null;
  }

  function drawPhoto(ctx, img, panel, photo, grade) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var scale = Math.max(panel.w / iw, panel.h / ih) * (photo.zoom || 1);
    var dw = iw * scale, dh = ih * scale;
    var dx = panel.x + (panel.w - dw) / 2 - (photo.ox - 0.5) * (dw - panel.w);
    var dy = panel.y + (panel.h - dh) / 2 - (photo.oy - 0.5) * (dh - panel.h);
    ctx.save();
    roundRect(ctx, panel.x, panel.y, panel.w, panel.h, Math.max(4, panel.w * 0.008));
    ctx.clip();
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    ctx.filter = 'none';
  }

  function panelFrame(ctx, panel) {
    ctx.save();
    roundRect(ctx, panel.x, panel.y, panel.w, panel.h, Math.max(4, panel.w * 0.008));
    ctx.lineWidth = Math.max(2, panel.w * 0.004);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.restore();
  }

  function drawCaption(ctx, rect, caption, sub, scale) {
    var pad = 10 * scale;
    ctx.save();
    ctx.fillStyle = 'rgba(12, 4, 24, 0.82)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 4 * scale);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(rect.x, rect.y + 4 * scale, 3 * scale, rect.h - 8 * scale);
    var tx = rect.x + pad + 4 * scale;
    var capPx = fitFont(ctx, caption, rect.w - pad * 2 - 8 * scale, 30 * scale, 'Anton, sans-serif', '400');
    ctx.font = '400 ' + capPx + 'px Anton, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(caption, tx, rect.y + rect.h * 0.36);
    var subPx = Math.max(10, Math.round(17 * scale));
    ctx.font = '600 ' + subPx + 'px system-ui, sans-serif';
    ctx.fillStyle = '#ffb3d9';
    ctx.fillText(sub, tx, rect.y + rect.h * 0.76);
    ctx.restore();
  }

  // A tiny palm silhouette for the tagline band: a curved trunk and six
  // drooping fronds, drawn as strokes. Original vector art, no images.
  function drawPalm(ctx, x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, 3 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 4 * s, y - 18 * s, x + 2 * s, y - 30 * s);
    ctx.stroke();
    var topX = x + 2 * s, topY = y - 30 * s;
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI * (0.08 + i * 0.17);
      var len = (20 + (i % 2) * 6) * s;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.5 - 4 * s,
        topX + Math.cos(a) * len, topY + Math.sin(a) * len * 0.7 + 8 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Press-quote strip, worn as a masthead kicker at the top of the cover:
  // five stars and an original line. Top placement keeps it clear of the
  // title, its glow, and every panel caption.
  function drawQuote(ctx, W, scale) {
    var text = '★★★★★  "PURE LEONIDA GOLD" — THE SUNSET GAZETTE';
    var px = Math.max(11, Math.round(21 * scale));
    ctx.save();
    ctx.font = '600 ' + px + 'px system-ui, sans-serif';
    var w = Math.min(ctx.measureText(text).width + 40 * scale, W * 0.60);
    while (px > 11 && ctx.measureText(text).width + 40 * scale > W * 0.60) {
      px -= 1;
      ctx.font = '600 ' + px + 'px system-ui, sans-serif';
    }
    var h = Math.round(34 * scale);
    var x = (W - w) / 2;
    var y = Math.round(10 * scale);
    ctx.fillStyle = 'rgba(12, 4, 24, 0.88)';
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, y + h / 2 + 1 * scale);
    ctx.restore();
  }

  function starburst(ctx, cx, cy, rOuter, rInner, points) {    ctx.beginPath();
    for (var i = 0; i < points * 2; i++) {
      var r = (i % 2 === 0) ? rOuter : rInner;
      var a = (Math.PI * i) / points - Math.PI / 2;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawBadges(ctx, w, h, scale) {
    // WANTED pill, top-left over the hero panel.
    var pillH = 44 * scale, pillW = 300 * scale;
    ctx.save();
    ctx.fillStyle = '#ff2e63';
    roundRect(ctx, 18 * scale, 18 * scale, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.font = '400 ' + Math.round(26 * scale) + 'px Anton, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText('WANTED ★★★★★', 36 * scale, 18 * scale + pillH / 2 + 1 * scale);
    ctx.restore();

    // EST. 2026 starburst, top-right corner.
    var cx = w - 78 * scale, cy = 82 * scale, ro = 74 * scale, ri = 58 * scale;
    ctx.save();
    starburst(ctx, cx, cy, ro, ri, 14);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#1b1030';
    ctx.stroke();
    ctx.fillStyle = '#1b1030';
    ctx.textAlign = 'center';
    ctx.font = '400 ' + Math.round(26 * scale) + 'px Anton, sans-serif';
    ctx.fillText('EST.', cx, cy - 12 * scale);
    ctx.font = '400 ' + Math.round(20 * scale) + 'px Anton, sans-serif';
    ctx.fillText('2026', cx, cy + 16 * scale);
    ctx.restore();

    // VOL. 06 pill, tucked against the starburst's left edge.
    var vw = 150 * scale, vh = 46 * scale;
    var vx = cx - ro - vw - 14 * scale, vy = cy - vh / 2;
    ctx.save();
    ctx.fillStyle = '#1b1030';
    roundRect(ctx, vx, vy, vw, vh, vh / 2);
    ctx.fill();
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#ffd166';
    ctx.stroke();
    ctx.font = '400 ' + Math.round(24 * scale) + 'px Anton, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VOL. 06', vx + vw / 2, vy + vh / 2 + 1 * scale);
    ctx.restore();
  }

  function drawGrain(ctx, w, h, seed) {
    var rnd = mulberry32(seed);
    var tile = document.createElement('canvas');
    tile.width = 128; tile.height = 128;
    var tctx = tile.getContext('2d');
    var img = tctx.createImageData(128, 128);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.floor(rnd() * 255);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 28;
    }
    tctx.putImageData(img, 0, 0);
    var pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function drawHalftone(ctx, w, h, titleBox, scale) {
    var step = Math.max(10, Math.round(15 * scale));
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (var y = Math.floor(h * 0.62); y < h; y += step) {
      var row = Math.round(y / step);
      for (var x = (row % 2 ? step / 2 : 0); x < w; x += step) {
        if (titleBox && x > titleBox.x - 20 && x < titleBox.x + titleBox.w + 20 &&
            y > titleBox.y - 20 && y < titleBox.y + titleBox.h + 20) continue;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, 2.1 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------- rendering

  function drawCover(ctx, state, images, W, H) {
    var scale = W / 1920;
    var layoutDef = find(LAYOUTS, state.layout);
    var geo = layoutDef.build(W, H);
    var grade = find(GRADES, state.grade);
    var tb = band(H);

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#150829';
    ctx.fillRect(0, 0, W, H);

    // Panels (a tilted panel rotates around its own centre).
    var panels = geo.panels;
    for (var i = 0; i < panels.length; i++) {
      var slot = state.panels[i % state.panels.length];
      var img = images[slot.photo];
      ctx.save();
      if (panels[i].tilt) {
        ctx.translate(panels[i].x + panels[i].w / 2, panels[i].y + panels[i].h / 2);
        ctx.rotate((panels[i].tilt * Math.PI) / 180);
        ctx.translate(-panels[i].w / 2, -panels[i].h / 2);
      }
      if (img) drawPhoto(ctx, img, panels[i], slot, grade);
      else { ctx.fillStyle = '#2a1548'; roundRect(ctx, panels[i].x, panels[i].y, panels[i].w, panels[i].h, 8); ctx.fill(); }
      panelFrame(ctx, panels[i]);
      ctx.restore();
    }

    // Grade wash + vignette.
    ctx.save();
    ctx.globalCompositeOperation = grade.overlayMode;
    ctx.globalAlpha = grade.overlayAlpha;
    ctx.fillStyle = grade.overlay;
    ctx.fillRect(0, 0, W, H - tb);
    ctx.restore();
    var vig = ctx.createRadialGradient(W / 2, (H - tb) / 2, Math.min(W, H) * 0.35,
                                       W / 2, (H - tb) / 2, Math.max(W, H) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10,2,20,0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H - tb);

    // Title: measure first so captions and halftone can avoid its box.
    // The box hugs the visible glyphs (Anton caps are ~0.72em tall), not
    // the full em box, so strips get their fair clearance. The title is
    // stretched 12% taller for a heavier poster presence.
    var TITLE_STRETCH = 1.12;
    var title = (state.title || 'SUNSET HEIST').toUpperCase();
    var titlePx = fitFont(ctx, title, W * 0.97, Math.round(300 * scale), 'Anton, sans-serif', '400');
    var titleW = ctx.measureText(title).width;
    var titleX = (W - titleW) / 2;
    var titleBaseline = Math.round(H * geo.titleY);
    var titleBox = { x: titleX - 10 * scale, y: titleBaseline - titlePx * 0.78 * TITLE_STRETCH,
                     w: titleW + 20 * scale, h: titlePx * 0.92 * TITLE_STRETCH };

    drawHalftone(ctx, W, H - tb, titleBox, scale);
    drawGrain(ctx, W, H - tb, 20261120);

    // Captions (collision-aware: never under the title).
    var stripH = Math.max(34, Math.round(H * 0.052));
    var pad = Math.max(8, Math.round(12 * scale));
    for (var j = 0; j < panels.length; j++) {
      var cap = state.panels[j % state.panels.length];
      if (!cap.caption) continue;
      var place = captionPlacement(panels[j], titleBox, stripH, pad, scale);
      if (place) drawCaption(ctx, place.rect, cap.caption, cap.sub || '', scale);
    }

    drawBadges(ctx, W, H - tb, scale);
    drawQuote(ctx, W, scale);

    // Title, drawn over everything for crisp lettering.
    var grad = ctx.createLinearGradient(0, titleBox.y, 0, titleBox.y + titleBox.h);
    grad.addColorStop(0, grade.titleTop);
    grad.addColorStop(0.55, grade.titleMid);
    grad.addColorStop(1, grade.titleBottom);
    ctx.save();
    ctx.translate(0, titleBaseline);
    ctx.scale(1, TITLE_STRETCH);
    ctx.translate(0, -titleBaseline);
    ctx.font = '400 ' + titlePx + 'px Anton, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = Math.round(34 * scale);
    ctx.strokeStyle = '#160428';
    ctx.lineWidth = Math.max(6, Math.round(titlePx * 0.075));
    ctx.strokeText(title, titleX, titleBaseline);
    ctx.shadowBlur = 0;
    ctx.fillStyle = grad;
    ctx.fillText(title, titleX, titleBaseline);
    ctx.restore();

    // Script: right-aligned inside the layout's sky-safe zone, sized to fit.
    var zone = geo.scriptZone;
    var script = state.script || '';
    if (script) {
      var scriptPx = fitFont(ctx, script, zone.w, Math.round(150 * scale), 'Pacifico, cursive', '400');
      ctx.save();
      ctx.font = '400 ' + scriptPx + 'px Pacifico, cursive';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = grade.glow;
      ctx.shadowBlur = Math.round(22 * scale);
      ctx.fillStyle = grade.script;
      ctx.fillText(script, zone.x + zone.w - ctx.measureText(script).width,
                   zone.y + zone.h / 2);
      ctx.restore();
    }

    // Tagline band, flanked by small palm silhouettes.
    ctx.save();
    ctx.fillStyle = '#12061f';
    ctx.fillRect(0, H - tb, W, tb);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(0, H - tb, W, Math.max(2, 3 * scale));
    var palmS = Math.max(0.4, tb / 64);
    var palmColor = 'rgba(255, 209, 102, 0.4)';
    drawPalm(ctx, 26 * scale, H - tb * 0.18, palmS, palmColor);
    drawPalm(ctx, 74 * scale, H - tb * 0.12, palmS * 0.8, palmColor);
    drawPalm(ctx, W - 26 * scale, H - tb * 0.18, palmS, palmColor);
    drawPalm(ctx, W - 74 * scale, H - tb * 0.12, palmS * 0.8, palmColor);
    ctx.font = '600 ' + Math.max(11, Math.round(24 * scale)) + 'px system-ui, sans-serif';
    ctx.fillStyle = '#f5e9ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline || '', W / 2, H - tb / 2 + 1 * scale);
    ctx.restore();

    ctx.restore();
    return { titleBox: titleBox, scriptZone: zone };
  }

  function defaultState() {
    var panels = [];
    for (var i = 0; i < 9; i++) {
      var photo = SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length].id;
      var cap = DEFAULT_CAPTIONS[i % DEFAULT_CAPTIONS.length];
      panels.push({ photo: photo, zoom: 1, ox: 0.5, oy: 0.5,
                    caption: cap.caption, sub: cap.sub });
    }
    return {
      layout: 'sunset-state',
      grade: 'sunset',
      size: 'landscape',
      title: 'SUNSET HEIST',
      script: 'Vice City nights',
      tagline: 'EVERY SUNSET HAS A PRICE • LEONIDA, 2026',
      panels: panels
    };
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function assignNoRepeat(state, order) {
    // Fill the layout's slots from the photo order without an immediate
    // repeat; a layout with more slots than photos cycles the order.
    var photos = order || SAMPLE_PHOTOS.map(function (p) { return p.id; });
    var n = state.panels.length;
    for (var i = 0; i < n; i++) {
      state.panels[i].photo = photos[i % photos.length];
    }
  }

  window.CoverStudio = {
    SAMPLE_PHOTOS: SAMPLE_PHOTOS,
    DEFAULT_CAPTIONS: DEFAULT_CAPTIONS,
    GRADES: GRADES,
    SIZES: SIZES,
    TITLES: TITLES,
    LAYOUTS: LAYOUTS,
    find: find,
    drawCover: drawCover,
    defaultState: defaultState,
    cloneState: cloneState,
    assignNoRepeat: assignNoRepeat
  };
})();
