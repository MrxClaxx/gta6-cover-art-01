// Leonida Nights — editor: pick photos, pan and zoom each panel, edit the
// caption, export the poster as a PNG in 1080 x 1080, 1080 x 1350 or
// 1920 x 1080. Fully offline; photos are read on this machine only.
import { POSTER_SIZES, SAMPLE_SCENES, createDefaultState, layoutFor, drawCover, renderCoverToCanvas } from './cover.js';

const state = createDefaultState();
const images = [null, null, null, null, null];
let selected = 0;
let previewSize = 'portrait';
let loadedCount = 0;

const preview = document.getElementById('preview');
const previewCtx = preview.getContext('2d');
const sizeButtons = document.querySelectorAll('[data-size]');
const titleInput = document.getElementById('title-input');
const taglineInput = document.getElementById('tagline-input');
const panelList = document.getElementById('panel-list');
const gallery = document.getElementById('sample-gallery');
const statusLine = document.getElementById('status-line');

function markReady() {
  window.__leonidaReady = true;
  document.title = 'Leonida Nights — ready';
}

function loadPanelImage(index) {
  const panel = state.panels[index];
  const img = new Image();
  img.onload = () => {
    images[index] = img;
    loadedCount += 1;
    renderPreview();
    if (loadedCount >= 5) markReady();
  };
  img.onerror = () => {
    images[index] = null;
    renderPreview();
  };
  img.src = panel.src;
}

function loadAllSamples() {
  loadedCount = 0;
  for (let i = 0; i < 5; i++) loadPanelImage(i);
}

function renderPreview() {
  const layout = layoutFor(previewSize);
  preview.width = layout.width;
  preview.height = layout.height;
  drawCover(previewCtx, state, previewSize, images);
  statusLine.textContent = 'Preview: ' + POSTER_SIZES[previewSize].label + ' — panel ' + (selected + 1) + ' of 5 selected (' + state.panels[selected].label + ').';
}

function panelAtPoint(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const x = (clientX - rect.left) * (preview.width / rect.width);
  const y = (clientY - rect.top) * (preview.height / rect.height);
  const layout = layoutFor(previewSize);
  if (x >= layout.hero.x && x <= layout.hero.x + layout.hero.width && y >= layout.hero.y && y <= layout.hero.y + layout.hero.height) return 0;
  for (let i = 0; i < 4; i++) {
    const p = layout.grid[i].photo;
    if (x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height) return i + 1;
  }
  return -1;
}

function buildPanelList() {
  panelList.innerHTML = '';
  state.panels.forEach((panel, index) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (index === selected ? ' selected' : '');
    row.dataset.index = String(index);
    const name = document.createElement('span');
    name.className = 'panel-name';
    name.textContent = (index === 0 ? 'HERO — ' : 'PANEL ' + index + ' — ') + panel.label;
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = panel.label;
    labelInput.setAttribute('aria-label', 'Label for panel ' + (index + 1));
    labelInput.addEventListener('input', () => {
      panel.label = labelInput.value.toUpperCase().slice(0, 18);
      name.textContent = (index === 0 ? 'HERO — ' : 'PANEL ' + index + ' — ') + panel.label;
      renderPreview();
    });
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.setAttribute('aria-label', 'Choose a photo for panel ' + (index + 1));
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) assignFile(index, fileInput.files[0]);
    });
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '3';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom);
    zoom.setAttribute('aria-label', 'Zoom for panel ' + (index + 1));
    zoom.addEventListener('input', () => {
      panel.zoom = parseFloat(zoom.value);
      renderPreview();
    });
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Reset crop';
    reset.addEventListener('click', () => {
      panel.zoom = 1;
      panel.panX = 0;
      panel.panY = 0;
      zoom.value = '1';
      renderPreview();
    });
    row.appendChild(name);
    row.appendChild(labelInput);
    row.appendChild(fileInput);
    row.appendChild(zoom);
    row.appendChild(reset);
    row.addEventListener('click', (event) => {
      if (event.target === labelInput || event.target === fileInput || event.target === zoom) return;
      selectPanel(index);
    });
    panelList.appendChild(row);
  });
}

function selectPanel(index) {
  selected = index;
  buildPanelList();
  renderPreview();
}

function assignFile(index, file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    images[index] = img;
    state.panels[index].src = url;
    state.panels[index].zoom = 1;
    state.panels[index].panX = 0;
    state.panels[index].panY = 0;
    renderPreview();
  };
  img.src = url;
  selectPanel(index);
}

function assignSample(index, scene) {
  const panel = state.panels[index];
  panel.src = 'samples/' + scene.file;
  panel.label = scene.label;
  panel.focus = { x: scene.focus.x, y: scene.focus.y };
  panel.zoom = 1;
  panel.panX = 0;
  panel.panY = 0;
  loadPanelImage(index);
  buildPanelList();
}

function buildGallery() {
  SAMPLE_SCENES.forEach((scene) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sample-thumb';
    button.title = scene.label + ' — click to load into the selected panel';
    const img = document.createElement('img');
    img.src = 'samples/' + scene.file;
    img.alt = scene.label;
    const caption = document.createElement('span');
    caption.textContent = scene.label;
    button.appendChild(img);
    button.appendChild(caption);
    button.addEventListener('click', () => assignSample(selected, scene));
    gallery.appendChild(button);
  });
}

function exportPoster(sizeKey) {
  const canvas = renderCoverToCanvas(state, sizeKey, images);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leonida-nights-' + sizeKey + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

let dragging = false;
let lastX = 0;
let lastY = 0;

preview.addEventListener('pointerdown', (event) => {
  const hit = panelAtPoint(event.clientX, event.clientY);
  if (hit >= 0) {
    selectPanel(hit);
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    preview.setPointerCapture(event.pointerId);
  }
});

preview.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const rect = preview.getBoundingClientRect();
  const scale = preview.width / rect.width;
  const panel = state.panels[selected];
  panel.panX += (event.clientX - lastX) * scale;
  panel.panY += (event.clientY - lastY) * scale;
  lastX = event.clientX;
  lastY = event.clientY;
  renderPreview();
});

preview.addEventListener('pointerup', () => { dragging = false; });
preview.addEventListener('pointercancel', () => { dragging = false; });

preview.addEventListener('wheel', (event) => {
  event.preventDefault();
  const panel = state.panels[selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
  renderPreview();
  buildPanelList();
}, { passive: false });

preview.addEventListener('dragover', (event) => event.preventDefault());
preview.addEventListener('drop', (event) => {
  event.preventDefault();
  const hit = panelAtPoint(event.clientX, event.clientY);
  const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
  if (hit >= 0 && file) assignFile(hit, file);
});

sizeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    previewSize = button.dataset.size;
    sizeButtons.forEach((b) => b.classList.toggle('active', b === button));
    renderPreview();
  });
});

titleInput.addEventListener('input', () => {
  state.title = titleInput.value.toUpperCase().slice(0, 24) || 'LEONIDA NIGHTS';
  renderPreview();
});

taglineInput.addEventListener('input', () => {
  state.tagline = taglineInput.value.slice(0, 60) || 'Every sunset hides a story.';
  renderPreview();
});

document.getElementById('fill-all').addEventListener('click', () => {
  const source = state.panels[selected];
  const sourceImage = images[selected];
  for (let i = 0; i < 5; i++) {
    state.panels[i].src = source.src;
    state.panels[i].focus = { x: source.focus.x, y: source.focus.y };
    state.panels[i].zoom = source.zoom;
    state.panels[i].panX = source.panX;
    state.panels[i].panY = source.panY;
    images[i] = sourceImage;
  }
  renderPreview();
});

document.getElementById('load-samples').addEventListener('click', () => {
  const fresh = createDefaultState();
  state.title = fresh.title;
  state.tagline = fresh.tagline;
  state.panels = fresh.panels;
  titleInput.value = state.title;
  taglineInput.value = state.tagline;
  loadAllSamples();
  buildPanelList();
});

document.querySelectorAll('[data-export]').forEach((button) => {
  button.addEventListener('click', () => exportPoster(button.dataset.export));
});

// Headless export mode: ?export=portrait|square|wide shows the finished
// poster alone at full size, so it can be screenshotted exactly as exported.
const params = new URLSearchParams(window.location.search);
const exportSize = params.get('export');
if (exportSize && POSTER_SIZES[exportSize]) {
  document.getElementById('editor').style.display = 'none';
  const wrap = document.getElementById('export-view');
  wrap.style.display = 'block';
  const canvas = document.getElementById('export-canvas');
  const size = POSTER_SIZES[exportSize];
  canvas.width = size.width;
  canvas.height = size.height;
  const drawWhenReady = () => {
    const ctx = canvas.getContext('2d');
    drawCover(ctx, state, exportSize, images);
    markReady();
  };
  const checkLoaded = () => {
    if (loadedCount >= 5) drawWhenReady();
    else setTimeout(checkLoaded, 100);
  };
  loadAllSamples();
  checkLoaded();
} else {
  titleInput.value = state.title;
  taglineInput.value = state.tagline;
  buildGallery();
  buildPanelList();
  loadAllSamples();
  renderPreview();
}
