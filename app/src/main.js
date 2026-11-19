// main.js — editor for Neon Coast Cover Studio (v4, fresh rewrite).
// Wires the preview canvas, the photo tray, layout/grade controls, panel
// crop + position, undo/redo, Surprise me and PNG export. Everything runs
// offline from the app's own files; no network calls anywhere.

(function () {
  'use strict';

  var CS = window.CoverStudio;
  var $ = function (id) { return document.getElementById(id); };

  var state = CS.defaultState();
  var images = {};          // photo id -> HTMLImageElement
  var uploads = [];         // uploaded photo ids, in order
  var uploadCount = 0;
  var selected = 0;         // selected panel slot index
  var undoStack = [];
  var redoStack = [];
  var previewW = 960, previewH = 540;
  var canvas, ctx;
  var shotMode = new URLSearchParams(location.search).get('shot') === 'cover';

  // ------------------------------------------------------------ history

  function pushHistory() {
    undoStack.push(CS.cloneState(state));
    if (undoStack.length > 60) undoStack.shift();
    redoStack.length = 0;
    refreshHistoryButtons();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(CS.cloneState(state));
    state = undoStack.pop();
    syncControls();
    render();
    refreshHistoryButtons();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(CS.cloneState(state));
    state = redoStack.pop();
    syncControls();
    render();
    refreshHistoryButtons();
  }

  function refreshHistoryButtons() {
    $('undoBtn').disabled = !undoStack.length;
    $('redoBtn').disabled = !redoStack.length;
  }

  // ------------------------------------------------------------ loading

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function loadAll() {
    var jobs = CS.SAMPLE_PHOTOS.map(function (p) {
      return loadImage(p.src).then(function (img) { images[p.id] = img; });
    });
    var fonts = [];
    if (document.fonts) {
      fonts.push(document.fonts.load('400 100px Anton'));
      fonts.push(document.fonts.load('400 100px Pacifico'));
      fonts.push(document.fonts.load('600 20px system-ui'));
    }
    return Promise.all(jobs.concat(fonts)).catch(function () { /* keep going */ });
  }

  // ------------------------------------------------------------ render

  function previewSize() {
    var size = CS.SIZES[state.size];
    var maxW = shotMode ? window.innerWidth : 960;
    var scale = Math.min(1, maxW / size.w);
    if (shotMode) scale = Math.max(window.innerWidth / size.w, window.innerHeight / size.h);
    previewW = Math.round(size.w * scale);
    previewH = Math.round(size.h * scale);
  }

  function render() {
    previewSize();
    if (canvas.width !== previewW || canvas.height !== previewH) {
      canvas.width = previewW;
      canvas.height = previewH;
    }
    canvas.style.width = previewW + 'px';
    canvas.style.height = previewH + 'px';
    CS.drawCover(ctx, state, images, previewW, previewH);
    highlightSelected();
  }

  function geometry() {
    var layout = CS.find(CS.LAYOUTS, state.layout);
    return layout.build(previewW, previewH);
  }

  function highlightSelected() {
    if (shotMode) return;
    var geo = geometry();
    var p = geo.panels[selected % geo.panels.length];
    if (!p) return;
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
    ctx.restore();
  }

  function panelAt(mx, my) {
    var geo = geometry();
    for (var i = geo.panels.length - 1; i >= 0; i--) {
      var p = geo.panels[i];
      if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) return i;
    }
    return -1;
  }

  // ------------------------------------------------------------ controls

  function buildTray() {
    var tray = $('tray');
    tray.innerHTML = '';
    CS.SAMPLE_PHOTOS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'tray-item';
      b.title = p.label;
      var img = document.createElement('img');
      img.src = p.src;
      img.alt = p.label;
      b.appendChild(img);
      var lab = document.createElement('span');
      lab.textContent = p.label;
      b.appendChild(lab);
      b.addEventListener('click', function () { assignPhoto(p.id); });
      tray.appendChild(b);
    });
    uploads.forEach(function (id) {
      var b = document.createElement('button');
      b.className = 'tray-item uploaded';
      b.title = 'Your photo';
      var img = document.createElement('img');
      img.src = images[id].src;
      img.alt = 'Uploaded photo';
      b.appendChild(img);
      var lab = document.createElement('span');
      lab.textContent = 'Upload';
      b.appendChild(lab);
      b.addEventListener('click', function () { assignPhoto(id); });
      tray.appendChild(b);
    });
  }

  function assignPhoto(photoId) {
    pushHistory();
    state.panels[selected].photo = photoId;
    state.panels[selected].zoom = 1;
    state.panels[selected].ox = 0.5;
    state.panels[selected].oy = 0.5;
    render();
  }

  function buildLayoutButtons() {
    var wrap = $('layoutGrid');
    wrap.innerHTML = '';
    CS.LAYOUTS.forEach(function (l) {
      var b = document.createElement('button');
      b.className = 'layout-btn' + (l.id === state.layout ? ' active' : '');
      b.textContent = l.name;
      b.addEventListener('click', function () {
        if (state.layout === l.id) return;
        pushHistory();
        state.layout = l.id;
        selected = 0;
        buildLayoutButtons();
        syncPanelEditor();
        render();
      });
      wrap.appendChild(b);
    });
  }

  function buildGradeButtons() {
    var wrap = $('gradeRow');
    wrap.innerHTML = '';
    CS.GRADES.forEach(function (g) {
      var b = document.createElement('button');
      b.className = 'grade-btn' + (g.id === state.grade ? ' active' : '');
      b.style.background = 'linear-gradient(135deg,' + g.titleTop + ',' + g.titleBottom + ')';
      b.textContent = g.name;
      b.addEventListener('click', function () {
        if (state.grade === g.id) return;
        pushHistory();
        state.grade = g.id;
        buildGradeButtons();
        render();
      });
      wrap.appendChild(b);
    });
  }

  function buildSizeButtons() {
    var wrap = $('sizeRow');
    wrap.innerHTML = '';
    Object.keys(CS.SIZES).forEach(function (key) {
      var s = CS.SIZES[key];
      var b = document.createElement('button');
      b.className = 'size-btn' + (key === state.size ? ' active' : '');
      b.textContent = s.label;
      b.addEventListener('click', function () {
        if (state.size === key) return;
        pushHistory();
        state.size = key;
        buildSizeButtons();
        render();
      });
      wrap.appendChild(b);
    });
  }

  function syncControls() {
    $('titleInput').value = state.title;
    $('scriptInput').value = state.script;
    $('taglineInput').value = state.tagline;
    buildLayoutButtons();
    buildGradeButtons();
    buildSizeButtons();
    syncPanelEditor();
  }

  function syncPanelEditor() {
    var geo = geometry();
    var slot = state.panels[selected % geo.panels.length];
    $('panelName').textContent = 'Panel ' + (selected + 1) + ' of ' + geo.panels.length;
    $('captionInput').value = slot.caption || '';
    $('subInput').value = slot.sub || '';
    $('zoomInput').value = Math.round((slot.zoom || 1) * 100);
    $('zoomVal').textContent = Math.round((slot.zoom || 1) * 100) + '%';
  }

  function bindInputs() {
    $('titleInput').addEventListener('input', function () {
      state.title = this.value;
      render();
    });
    $('titleInput').addEventListener('change', pushHistory);
    $('scriptInput').addEventListener('input', function () {
      state.script = this.value;
      render();
    });
    $('scriptInput').addEventListener('change', pushHistory);
    $('taglineInput').addEventListener('input', function () {
      state.tagline = this.value;
      render();
    });
    $('taglineInput').addEventListener('change', pushHistory);
    $('captionInput').addEventListener('input', function () {
      state.panels[selected].caption = this.value;
      render();
    });
    $('captionInput').addEventListener('change', pushHistory);
    $('subInput').addEventListener('input', function () {
      state.panels[selected].sub = this.value;
      render();
    });
    $('subInput').addEventListener('change', pushHistory);
    $('zoomInput').addEventListener('input', function () {
      state.panels[selected].zoom = this.value / 100;
      $('zoomVal').textContent = this.value + '%';
      render();
    });
    $('zoomInput').addEventListener('change', pushHistory);
    $('undoBtn').addEventListener('click', undo);
    $('redoBtn').addEventListener('click', redo);
    $('surpriseBtn').addEventListener('click', surprise);
    $('exportBtn').addEventListener('click', exportCover);
    $('uploadBtn').addEventListener('click', function () { $('fileInput').click(); });
    $('fileInput').addEventListener('change', handleFiles);
  }

  function bindCanvas() {
    var dragging = false, moved = false, lastX = 0, lastY = 0;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width),
               y: (e.clientY - r.top) * (canvas.height / r.height) };
    }
    canvas.addEventListener('pointerdown', function (e) {
      var p = pos(e);
      var hit = panelAt(p.x, p.y);
      if (hit < 0) return;
      selected = hit;
      syncPanelEditor();
      render();
      dragging = true; moved = false;
      lastX = p.x; lastY = p.y;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var p = pos(e);
      var dx = p.x - lastX, dy = p.y - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
      var geo = geometry();
      var panel = geo.panels[selected];
      var slot = state.panels[selected];
      var img = images[slot.photo];
      if (img && panel) {
        var iw = img.naturalWidth, ih = img.naturalHeight;
        var scale = Math.max(panel.w / iw, panel.h / ih) * (slot.zoom || 1);
        var dw = iw * scale, dh = ih * scale;
        slot.ox = clamp(slot.ox - dx / Math.max(1, dw - panel.w), 0, 1);
        slot.oy = clamp(slot.oy - dy / Math.max(1, dh - panel.h), 0, 1);
      }
      lastX = p.x; lastY = p.y;
      render();
    });
    canvas.addEventListener('pointerup', function () {
      if (dragging && moved) pushHistory();
      dragging = false;
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var slot = state.panels[selected];
      pushHistory();
      slot.zoom = clamp((slot.zoom || 1) * (e.deltaY < 0 ? 1.1 : 0.9), 1, 3);
      syncPanelEditor();
      render();
    }, { passive: false });
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function handleFiles(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    files.forEach(function (file) {
      if (!file.type.match(/^image\//)) return;
      var reader = new FileReader();
      reader.onload = function () {
        var id = 'up' + (++uploadCount);
        loadImage(reader.result).then(function (img) {
          images[id] = img;
          uploads.push(id);
          buildTray();
          assignPhoto(id);
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function surprise() {
    pushHistory();
    var layout = CS.LAYOUTS[Math.floor(Math.random() * CS.LAYOUTS.length)];
    var grade = CS.GRADES[Math.floor(Math.random() * CS.GRADES.length)];
    var title = CS.TITLES[Math.floor(Math.random() * CS.TITLES.length)];
    var order = CS.SAMPLE_PHOTOS.map(function (p) { return p.id; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    state.layout = layout.id;
    state.grade = grade.id;
    state.title = title.title;
    state.script = title.script;
    CS.assignNoRepeat(state, order);
    selected = 0;
    syncControls();
    render();
  }

  function exportCover() {
    var size = CS.SIZES[state.size];
    var off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    CS.drawCover(off.getContext('2d'), state, images, size.w, size.h);
    off.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cover-' + state.size + '-' + state.layout + '.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }, 'image/png');
  }

  // Shot mode: full-viewport cover, no editor chrome, for screenshots.
  // The same drawCover() the export button uses, so the shot IS the export.
  window.__exportCover = function (sizeKey, maxW, quality) {
    var size = CS.SIZES[sizeKey] || CS.SIZES.landscape;
    var scale = maxW ? Math.min(1, maxW / size.w) : 1;
    var w = Math.round(size.w * scale), h = Math.round(size.h * scale);
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    CS.drawCover(off.getContext('2d'), state, images, w, h);
    return off.toDataURL('image/jpeg', quality || 0.8);
  };
  window.__setState = function (patch) {
    Object.assign(state, patch);
    syncControls();
    render();
  };

  function boot() {
    canvas = $('stage');
    ctx = canvas.getContext('2d');
    if (shotMode) document.body.classList.add('shot');
    var params = new URLSearchParams(location.search);
    if (params.get('layout')) state.layout = params.get('layout');
    if (params.get('grade')) state.grade = params.get('grade');
    if (params.get('size')) state.size = params.get('size');
    buildTray();
    syncControls();
    bindInputs();
    bindCanvas();
    loadAll().then(function () { render(); window.__ready = true; });
    render();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
