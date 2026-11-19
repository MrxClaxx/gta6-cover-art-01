// Neon Coast Cover Studio — editor (v2: centred-logo cover, distinct photos).
// Live canvas preview, click-to-select panels, drag to position + wheel to zoom,
// upload/crop per panel, 10 layouts, 5 grades, editable title/subtitle/tagline,
// undo/redo, Surprise me, PNG export in 3 post sizes. Offline: all files local.
// URL params make shots deterministic: ?shot=cover|editor&layout=..&grade=..&size=..
// &sample=..&title=..&subtitle=..&seed=.. (seed drives Surprise me).
// v2: the default layout is 'sunset-state' (cinematic hero + 5 distinct panels)
// and panel photos are never repeated within a cover — the first six panels
// always show six different samples; longer layouts cycle only after every
// sample has been used once.

import { SAMPLES, GRADES, LAYOUTS, SIZES, CAPTIONS, drawCover, layoutPanels, panelAt } from './cover.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const shot = params.get('shot') || 'editor';

function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Seeded shuffle of the sample ids — panels take the first N, so no photo
// repeats until every sample has been used once.
function distinctOrder(seed) {
  const order = SAMPLES.map((s) => s.id);
  const rnd = mulberry(seed);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// The default cover opens with the cinematic golden-hour hero photo; the rest
// are distinct samples in a fixed order that matches the panel captions.
const HERO_ORDER = ['boulevard', 'tower', 'marina', 'rooftop', 'pier', 'speedboat'];

function defaultPanels(layoutId) {
  const lay = LAYOUTS.find((l) => l.id === layoutId) || LAYOUTS[0];
  const order = layoutId === 'sunset-state' ? HERO_ORDER : distinctOrder(20261120);
  return lay.panels.map((_, i) => ({
    photo: order[i % order.length],
    zoom: 1, ox: 0, oy: 0,
    caption: { ...CAPTIONS[i % CAPTIONS.length] },
  }));
}

function defaultState() {
  return {
    layout: 'sunset-state', grade: 'sunset', size: 'landscape',
    title: 'SUNSET HEIST', subtitle: 'Vice City nights',
    tagline: 'EVERY SUNSET HAS A PRICE  •  LEONIDA, 2026',
    panels: defaultPanels('sunset-state'),
    badges: true, captions: true, grain: true,
  };
}

let state = defaultState();
let selected = 0;
const images = new Map();       // photoId -> HTMLImageElement
const uploads = new Map();      // uploadId -> dataURL
let undoStack = [], redoStack = [];

function snapshot() { return JSON.stringify(state); }
function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 40) undoStack.shift(); redoStack = []; updateUndoButtons(); }
function restore(json) { state = JSON.parse(json); state.panels = state.panels.map((p) => ({ ...p, caption: { ...p.caption } })); selected = Math.min(selected, state.panels.length - 1); syncControls(); render(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); updateUndoButtons(); }
function redo() { if (!undoStack.length) return; undoStack.push(snapshot()); restore(undoStack.pop()); updateUndoButtons(); }
function updateUndoButtons() { $('#undoBtn').disabled = !undoStack.length; $('#redoBtn').disabled = !redoStack.length; }

function loadImage(id, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images.set(id, img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  await Promise.all(SAMPLES.map((s) => loadImage(s.id, s.src)));
  await document.fonts.load('100px Anton');
  await document.fonts.load('100px Pacifico');
  await document.fonts.ready;
}

const canvas = $('#coverCanvas');
const ctx = canvas.getContext('2d');

function currentSize() { return SIZES.find((s) => s.id === state.size) || SIZES[0]; }

function render() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  drawCover(ctx, state, w, h, images);
  drawSelection();
}

function drawSelection() {
  if (shot === 'cover') return;
  const { w, h } = currentSize();
  const panels = layoutPanels(state.layout, w, h);
  const p = panels[selected];
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = Math.max(3, w * 0.003);
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.setLineDash([]);
  ctx.fillStyle = '#00e5ff';
  ctx.font = `800 ${Math.max(16, Math.round(w * 0.014))}px Arial, sans-serif`;
  ctx.fillText(`PANEL ${selected + 1}`, p.x + 10, p.y + Math.max(20, Math.round(w * 0.02)));
  ctx.restore();
}

function toCoverCoords(e) {
  const r = canvas.getBoundingClientRect();
  const { w, h } = currentSize();
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = toCoverCoords(e);
  const { w, h } = currentSize();
  const idx = panelAt(state.layout, w, h, x, y);
  if (idx < 0) return;
  if (idx !== selected) { selected = idx; syncPanelControls(); render(); }
  drag = { x, y, ox: state.panels[idx].ox, oy: state.panels[idx].oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { x, y } = toCoverCoords(e);
  const { w, h } = currentSize();
  const p = layoutPanels(state.layout, w, h)[selected];
  const dx = (x - drag.x) / p.w, dy = (y - drag.y) / p.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.004) drag.moved = true;
  state.panels[selected].ox = Math.max(-0.6, Math.min(0.6, drag.ox + dx));
  state.panels[selected].oy = Math.max(-0.6, Math.min(0.6, drag.oy + dy));
  render();
});
canvas.addEventListener('pointerup', () => { if (drag && drag.moved) pushUndoSilent(); drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const pc = state.panels[selected];
  pc.zoom = Math.max(1, Math.min(3, pc.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  $('#zoomRange').value = pc.zoom;
  $('#zoomVal').textContent = `${Math.round(pc.zoom * 100)}%`;
  render();
}, { passive: false });

// pushUndo without clearing redo on drag end: snapshot was taken at drag start instead.
let dragStartSnapshot = null;
canvas.addEventListener('pointerdown', () => { dragStartSnapshot = snapshot(); });
function pushUndoSilent() {
  if (dragStartSnapshot) { undoStack.push(dragStartSnapshot); if (undoStack.length > 40) undoStack.shift(); redoStack = []; updateUndoButtons(); dragStartSnapshot = null; }
}

function buildLayoutButtons() {
  const box = $('#layoutGrid');
  box.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.className = 'chip' + (l.id === state.layout ? ' active' : '');
    b.textContent = l.name;
    b.onclick = () => { pushUndo(); state.layout = l.id; state.panels = defaultPanels(l.id); selected = 0; syncControls(); render(); };
    box.appendChild(b);
  });
}

function buildGradeButtons() {
  const box = $('#gradeGrid');
  box.innerHTML = '';
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.className = 'chip grade' + (g.id === state.grade ? ' active' : '');
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${g.wash[0]},${g.wash[1]})"></span>${g.name}`;
    b.onclick = () => { pushUndo(); state.grade = g.id; syncControls(); render(); };
    box.appendChild(b);
  });
}

function buildSizeButtons() {
  const box = $('#sizeGrid');
  box.innerHTML = '';
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.className = 'chip' + (s.id === state.size ? ' active' : '');
    b.textContent = s.name;
    b.onclick = () => { pushUndo(); state.size = s.id; syncControls(); render(); };
    box.appendChild(b);
  });
}

function buildPhotoPicker() {
  const box = $('#photoPicker');
  box.innerHTML = '';
  SAMPLES.forEach((s) => {
    const d = document.createElement('button');
    d.className = 'thumb' + (state.panels[selected]?.photo === s.id ? ' active' : '');
    d.title = s.label;
    d.innerHTML = `<img src="${s.src}" alt="${s.label}"><span>${s.label}</span>`;
    d.onclick = () => { pushUndo(); state.panels[selected].photo = s.id; buildPhotoPicker(); render(); };
    box.appendChild(d);
  });
  uploads.forEach((url, id) => {
    const d = document.createElement('button');
    d.className = 'thumb' + (state.panels[selected]?.photo === id ? ' active' : '');
    d.innerHTML = `<img src="${url}" alt="Upload"><span>Upload</span>`;
    d.onclick = () => { pushUndo(); state.panels[selected].photo = id; buildPhotoPicker(); render(); };
    box.appendChild(d);
  });
}

function syncPanelControls() {
  const pc = state.panels[selected] || {};
  $('#panelLabel').textContent = `Panel ${selected + 1} of ${state.panels.length}`;
  $('#zoomRange').value = pc.zoom || 1;
  $('#zoomVal').textContent = `${Math.round((pc.zoom || 1) * 100)}%`;
  $('#capPlace').value = pc.caption?.place || '';
  $('#capTime').value = pc.caption?.time || '';
  $('#capTag').value = pc.caption?.tag || '';
  buildPhotoPicker();
}

function syncControls() {
  $('#titleInput').value = state.title;
  $('#subtitleInput').value = state.subtitle;
  $('#taglineInput').value = state.tagline;
  $('#badgesToggle').checked = state.badges !== false;
  $('#captionsToggle').checked = state.captions !== false;
  $('#grainToggle').checked = state.grain !== false;
  buildLayoutButtons(); buildGradeButtons(); buildSizeButtons(); syncPanelControls();
}

function bindControls() {
  $('#titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('#subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('#taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; render(); });
  $('#titleInput').addEventListener('change', pushUndo);
  $('#subtitleInput').addEventListener('change', pushUndo);
  $('#taglineInput').addEventListener('change', pushUndo);
  $('#badgesToggle').addEventListener('change', (e) => { pushUndo(); state.badges = e.target.checked; render(); });
  $('#captionsToggle').addEventListener('change', (e) => { pushUndo(); state.captions = e.target.checked; render(); });
  $('#grainToggle').addEventListener('change', (e) => { pushUndo(); state.grain = e.target.checked; render(); });
  $('#zoomRange').addEventListener('input', (e) => { state.panels[selected].zoom = parseFloat(e.target.value); $('#zoomVal').textContent = `${Math.round(state.panels[selected].zoom * 100)}%`; render(); });
  $('#zoomRange').addEventListener('change', pushUndo);
  $('#capPlace').addEventListener('input', (e) => { state.panels[selected].caption.place = e.target.value.toUpperCase(); render(); });
  $('#capTime').addEventListener('input', (e) => { state.panels[selected].caption.time = e.target.value; render(); });
  $('#capTag').addEventListener('input', (e) => { state.panels[selected].caption.tag = e.target.value.toUpperCase(); render(); });
  $('#undoBtn').onclick = undo;
  $('#redoBtn').onclick = redo;
  $('#surpriseBtn').onclick = surpriseMe;
  $('#uploadInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    const id = `upload-${Date.now()}`;
    uploads.set(id, url);
    await loadImage(id, url);
    pushUndo();
    state.panels[selected].photo = id;
    buildPhotoPicker(); render();
    e.target.value = '';
  });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.onclick = () => exportCover(b.dataset.export);
  });
}

function surpriseMe() {
  pushUndo();
  const seed = (params.get('seed') ? parseInt(params.get('seed'), 10) : Date.now()) + Math.floor(Math.random() * 1e9);
  const rnd = mulberry(seed);
  const order = distinctOrder(seed);
  state.layout = LAYOUTS[Math.floor(rnd() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(rnd() * GRADES.length)].id;
  state.panels = defaultPanels(state.layout).map((p, i) => ({
    ...p,
    photo: order[i % order.length],
    zoom: 1 + rnd() * 0.6,
    ox: (rnd() - 0.5) * 0.3, oy: (rnd() - 0.5) * 0.3,
    caption: { ...CAPTIONS[Math.floor(rnd() * CAPTIONS.length)] },
  }));
  const titles = ['SUNSET HEIST', 'NEON SHORE', 'PIER PRESSURE', 'NIGHT SHIFT', 'VICE ROYALE', 'GOLDEN GETAWAY'];
  state.title = titles[Math.floor(rnd() * titles.length)];
  selected = 0;
  syncControls(); render();
}

async function exportCover(sizeId) {
  const size = SIZES.find((s) => s.id === sizeId) || currentSize();
  const off = document.createElement('canvas');
  off.width = size.w; off.height = size.h;
  const savedSize = state.size;
  drawCover(off.getContext('2d'), state, size.w, size.h, images);
  state.size = savedSize;
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-coast-cover-${size.id}-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  $('#exportNote').textContent = `Exported ${size.w} × ${size.h} PNG — check your downloads.`;
}

// Deterministic shot params (?shot=cover|editor) for screenshots.
function applyParams() {
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('size')) state.size = params.get('size');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('subtitle')) state.subtitle = params.get('subtitle');
  if (params.get('tagline')) state.tagline = params.get('tagline');
  if (params.get('sample')) {
    const order = params.get('sample').split(',');
    state.panels = defaultPanels(state.layout).map((p, i) => ({ ...p, photo: order[i % order.length] }));
  } else {
    state.panels = defaultPanels(state.layout);
  }
  if (params.get('seed')) {
    const seed = parseInt(params.get('seed'), 10);
    const rnd = mulberry(seed);
    const order = distinctOrder(seed);
    state.layout = LAYOUTS[Math.floor(rnd() * LAYOUTS.length)].id;
    state.grade = GRADES[Math.floor(rnd() * GRADES.length)].id;
    state.panels = defaultPanels(state.layout).map((p, i) => ({ ...p, photo: order[i % order.length], zoom: 1 + rnd() * 0.5 }));
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
}

async function init() {
  applyParams();
  bindControls();
  syncControls();
  await loadSamples();
  render();
  document.body.classList.add('ready');
}

init();
