/* ═══════════════════════════════════════════
   Vook — Webview Reader Script
   Adapted from simple-pdf-reader-master
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── VS Code API ─────────────────────────
  const vscode = window.__vscode;

  // ── DOM refs ────────────────────────────
  const pdfContainer = document.getElementById('pdf-container');
  const toggleBtn = document.getElementById('toggle-mode');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageInput = document.getElementById('page-input');
  const totalEl = document.getElementById('total');

  const outlineToggleBtn = document.getElementById('outline-toggle-btn');
  const outlinePanel = document.getElementById('outline-panel');

  const fileSelectBtn = document.getElementById('file-select-btn');

  const panelToggleBtn = document.getElementById('panel-toggle-btn');
  const paramPanel = document.getElementById('param-panel');

  const scaleSlider = document.getElementById('scale-slider');
  const scaleValue = document.getElementById('scale-value');
  const bodyBgColor = document.getElementById('body-bg-color');
  const canvasBgColor = document.getElementById('canvas-bg-color');
  const invertSlider = document.getElementById('invert-slider');
  const invertValue = document.getElementById('invert-value');
  const hueSlider = document.getElementById('hue-slider');
  const hueValue = document.getElementById('hue-value');
  const graySlider = document.getElementById('gray-slider');
  const grayValue = document.getElementById('gray-value');
  const brightSlider = document.getElementById('bright-slider');
  const brightValue = document.getElementById('bright-value');
  const contrastSlider = document.getElementById('contrast-slider');
  const contrastValue = document.getElementById('contrast-value');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');
  const marginLeftSlider = document.getElementById('margin-left-slider');
  const marginLeftValue = document.getElementById('margin-left-value');
  const confirmBtn = document.getElementById('confirm-btn');
  const resetBtn = document.getElementById('reset-btn');
  const magnifierToggleBtn = document.getElementById('magnifier-toggle');
  const magnifier = document.getElementById('magnifier');
  const magnifierCanvas = document.getElementById('magnifier-canvas');

  // ── State ───────────────────────────────
  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let pageContainer = null;
  let outlineData = [];

  const defaultParams = {
    scale: 2.0,
    marginLeft: -1,
    darkModeEnabled: true,
    bodyBackground: '#0c0c0c',
    canvasBackground: '#1a1a1a',
    invert: 80,
    hue: 180,
    grayscale: 10,
    brightness: 85,
    contrast: 90,
    fontOpacity: 1.0,
    magnifierZoomLevel: 2.5,
    wasdStep: 30,
  };

  let currentParams = Object.assign({}, defaultParams);
  let savedParams = Object.assign({}, defaultParams);

  // ── Initialization ──────────────────────
  pdfContainer.style.marginLeft = 'auto';
  pdfContainer.style.marginRight = 'auto';

  // ── Outline click handler ───────────────
  function handleOutlineItemClick(e) {
    e.stopPropagation();
    const targetItem = e.target.closest('.outline-item');
    if (!targetItem) return;
    if (targetItem.dataset.clickable !== 'true') return;
    const targetPage = parseInt(targetItem.dataset.page);
    if (targetPage && !isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      currentPage = targetPage;
      pageInput.value = currentPage;
      renderPage(currentPage).catch(err => console.error('Failed to render page:', err));
    }
  }

  // ── PDF Outline ─────────────────────────
  async function getPDFOutline() {
    outlinePanel.innerHTML = '<div class="outline-empty">Loading outline...</div>';
    if (!pdfDoc) {
      outlinePanel.innerHTML = '<div class="outline-empty">No outline available</div>';
      return;
    }
    try {
      const outline = await pdfDoc.getOutline();
      outlineData = [];

      async function parseOutline(items, level) {
        level = level || 0;
        const parsedItems = [];
        for (const item of items) {
          const outlineItem = { title: item.title || 'Untitled', level: level, pageNumber: null };
          if (item.dest) {
            let dest = item.dest;
            if (typeof dest === 'string') {
              dest = await pdfDoc.getDestination(dest);
            }
            if (dest && dest[0]) {
              const pageIndex = await pdfDoc.getPageIndex(dest[0]);
              outlineItem.pageNumber = pageIndex + 1;
            }
          }
          parsedItems.push(outlineItem);
          if (item.items && item.items.length > 0) {
            const childItems = await parseOutline(item.items, level + 1);
            parsedItems.push(...childItems);
          }
        }
        return parsedItems;
      }

      outlineData = await parseOutline(outline);
      renderOutlineItems();
    } catch (error) {
      console.error('Failed to get outline:', error);
      outlinePanel.innerHTML = '<div class="outline-empty">No outline available</div>';
    }
  }

  function renderOutlineItems() {
    outlinePanel.innerHTML = '';
    outlinePanel.removeEventListener('click', handleOutlineItemClick);
    outlinePanel.addEventListener('click', handleOutlineItemClick);

    if (outlineData.length === 0) {
      outlinePanel.innerHTML = '<div class="outline-empty">No outline available</div>';
      return;
    }

    outlineData.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'outline-item outline-level-' + item.level;
      div.textContent = item.title + (item.pageNumber ? ' (Page ' + item.pageNumber + ')' : '');
      div.dataset.page = item.pageNumber ? item.pageNumber.toString() : '';
      div.dataset.index = index.toString();
      if (item.pageNumber) {
        div.dataset.clickable = 'true';
        div.style.cursor = 'pointer';
      } else {
        div.dataset.clickable = 'false';
        div.style.cursor = 'default';
        div.style.opacity = '0.7';
      }
      outlinePanel.appendChild(div);
    });
  }

  function highlightAndScrollToCurrentPage() {
    if (outlineData.length === 0) return;

    const allItems = outlinePanel.querySelectorAll('.outline-item');
    allItems.forEach(item => item.classList.remove('outline-item-active'));

    let closestIndex = -1;
    let closestPage = -1;
    let exactMatchIndex = -1;

    outlineData.forEach((item, index) => {
      if (item.pageNumber) {
        if (item.pageNumber === currentPage) {
          exactMatchIndex = index;
        }
        if (item.pageNumber <= currentPage && item.pageNumber > closestPage) {
          closestPage = item.pageNumber;
          closestIndex = index;
        }
      }
    });

    const targetIndex = exactMatchIndex !== -1 ? exactMatchIndex : closestIndex;
    if (targetIndex !== -1) {
      const targetItem = outlinePanel.querySelector('.outline-item[data-index="' + targetIndex + '"]');
      if (targetItem) {
        if (exactMatchIndex !== -1) {
          targetItem.classList.add('outline-item-active');
        }
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // ── PDF Loading & Rendering ─────────────

  async function initPDF(url, data) {
    pdfContainer.innerHTML = '<div style="text-align:center;padding:60px 0;color:#999;">Loading PDF...</div>';
    try {
      const params = {
        cMapUrl: window.__cmapUrl,
        cMapPacked: true,
      };
      // Prefer binary data, fallback to URL
      if (data) {
        params.data = data;
      } else {
        params.url = url;
      }
      const loadingTask = pdfjsLib.getDocument(params);
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      totalEl.textContent = '/' + totalPages;
      currentPage = 1;
      pageInput.value = 1;
      await renderPage(currentPage);
      await getPDFOutline();
    } catch (error) {
      console.error('PDF loading failed:', error);
      pdfContainer.innerHTML = '<div style="text-align:center;padding:60px 0;color:#c00;">PDF loading failed. The file may be corrupted or unsupported.</div>';
      outlinePanel.innerHTML = '<div class="outline-empty">No outline available</div>';
    }
  }

  // ── Base64 → Uint8Array ──────────────────
  function base64ToUint8(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function renderPage(pageNum) {
    pdfContainer.innerHTML = '';
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: currentParams.scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page';
      pageContainer.appendChild(canvas);
      pdfContainer.appendChild(pageContainer);

      updateDynamicStyles();

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      // Re-apply panel zoom after page turn (panel mode)
      if (window.__vookMode === 'panel' && panelZoom !== 1.0) {
        var c = getCurrentCanvas();
        if (c) {
          c.style.transform = 'scale(' + panelZoom + ')';
          c.style.transformOrigin = 'top left';
        }
        if (panelZoom > 1.05) {
          pdfContainer.style.overflow = 'auto';
        }
      }
    } catch (error) {
      console.error('Page rendering failed:', error);
    }
  }

  // ── Dynamic Style Updates ───────────────

  function updateDynamicStyles() {
    // Margin
    if (currentParams.marginLeft === -1) {
      pdfContainer.style.marginLeft = 'auto';
      pdfContainer.style.marginRight = 'auto';
    } else {
      pdfContainer.style.marginLeft = currentParams.marginLeft + 'px';
      pdfContainer.style.marginRight = '0';
    }

    // Container width scales with zoom
    const baseWidth = 800;
    pdfContainer.style.width = (baseWidth * currentParams.scale * 0.5) + 'px';

    // Dark mode: CSS filters + colors + opacity
    if (document.body.classList.contains('dark-mode')) {
      document.body.style.backgroundColor = currentParams.bodyBackground;
      if (pageContainer) {
        const canvas = pageContainer.querySelector('canvas');
        if (canvas) {
          canvas.style.backgroundColor = currentParams.canvasBackground;
          canvas.style.filter = [
            'invert(' + currentParams.invert + '%)',
            'hue-rotate(' + currentParams.hue + 'deg)',
            'grayscale(' + currentParams.grayscale + '%)',
            'brightness(' + currentParams.brightness + '%)',
            'contrast(' + currentParams.contrast + '%)',
          ].join(' ');
          canvas.style.opacity = currentParams.fontOpacity;
        }
      }
    } else {
      document.body.style.backgroundColor = '';
      if (pageContainer) {
        const canvas = pageContainer.querySelector('canvas');
        if (canvas) {
          canvas.style.backgroundColor = '';
          canvas.style.filter = '';
          canvas.style.opacity = '';
        }
      }
    }
  }

  // ── Sync config to VS Code ──────────────

  function saveConfigToVSCode() {
    savedParams = Object.assign({}, currentParams);
    vscode.postMessage({
      type: 'saveConfig',
      config: {
        'scale': currentParams.scale,
        'marginLeft': currentParams.marginLeft,
        'darkMode.enabled': currentParams.darkModeEnabled,
        'darkMode.bodyBackground': currentParams.bodyBackground,
        'darkMode.canvasBackground': currentParams.canvasBackground,
        'darkMode.invert': currentParams.invert,
        'darkMode.hue': currentParams.hue,
        'darkMode.grayscale': currentParams.grayscale,
        'darkMode.brightness': currentParams.brightness,
        'darkMode.contrast': currentParams.contrast,
        'darkMode.fontOpacity': currentParams.fontOpacity,
      }
    });
  }

  // ── Apply config to UI ──────────────────

  function applyConfig(config) {
    if (config.scale !== undefined) {
      currentParams.scale = config.scale;
      scaleSlider.value = config.scale;
      scaleValue.textContent = config.scale.toFixed(1);
    }
    if (config.marginLeft !== undefined) {
      currentParams.marginLeft = config.marginLeft;
      marginLeftSlider.value = config.marginLeft;
      marginLeftValue.textContent = config.marginLeft === -1 ? 'auto (center)' : config.marginLeft + 'px';
    }
    if (config.bodyBackground !== undefined) {
      currentParams.bodyBackground = config.bodyBackground;
      bodyBgColor.value = config.bodyBackground;
    }
    if (config.canvasBackground !== undefined) {
      currentParams.canvasBackground = config.canvasBackground;
      canvasBgColor.value = config.canvasBackground;
    }
    if (config.invert !== undefined) {
      currentParams.invert = config.invert;
      invertSlider.value = config.invert;
      invertValue.textContent = config.invert + '%';
    }
    if (config.hue !== undefined) {
      currentParams.hue = config.hue;
      hueSlider.value = config.hue;
      hueValue.textContent = config.hue + 'deg';
    }
    if (config.grayscale !== undefined) {
      currentParams.grayscale = config.grayscale;
      graySlider.value = config.grayscale;
      grayValue.textContent = config.grayscale + '%';
    }
    if (config.brightness !== undefined) {
      currentParams.brightness = config.brightness;
      brightSlider.value = config.brightness;
      brightValue.textContent = config.brightness + '%';
    }
    if (config.contrast !== undefined) {
      currentParams.contrast = config.contrast;
      contrastSlider.value = config.contrast;
      contrastValue.textContent = config.contrast + '%';
    }
    if (config.fontOpacity !== undefined) {
      currentParams.fontOpacity = config.fontOpacity;
      opacitySlider.value = config.fontOpacity;
      opacityValue.textContent = config.fontOpacity.toFixed(2);
    }
    if (config.magnifierZoomLevel !== undefined) {
      currentParams.magnifierZoomLevel = config.magnifierZoomLevel;
    }
    if (config.wasdStep !== undefined) {
      currentParams.wasdStep = config.wasdStep;
    }
    if (config.darkModeEnabled !== undefined) {
      currentParams.darkModeEnabled = config.darkModeEnabled;
      if (config.darkModeEnabled) {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀ Light Mode';
      } else {
        document.body.classList.remove('dark-mode');
        toggleBtn.textContent = '🌙 Dark Mode';
      }
    }
  }

  // ── Slider Event Bindings ───────────────

  scaleSlider.addEventListener('input', function () {
    const val = parseFloat(this.value);
    scaleValue.textContent = val.toFixed(1);
    currentParams.scale = val;
  });

  marginLeftSlider.addEventListener('input', function () {
    const val = parseInt(this.value);
    currentParams.marginLeft = val;
    marginLeftValue.textContent = val === -1 ? 'auto (center)' : val + 'px';
  });

  invertSlider.addEventListener('input', function () {
    const val = parseInt(this.value);
    invertValue.textContent = val + '%';
    currentParams.invert = val;
  });

  hueSlider.addEventListener('input', function () {
    const val = parseInt(this.value);
    hueValue.textContent = val + 'deg';
    currentParams.hue = val;
  });

  graySlider.addEventListener('input', function () {
    const val = parseInt(this.value);
    grayValue.textContent = val + '%';
    currentParams.grayscale = val;
  });

  brightSlider.addEventListener('input', function () {
    const val = parseInt(this.value);
    brightValue.textContent = val + '%';
    currentParams.brightness = val;
  });

  contrastSlider.addEventListener('input', function () {
    const val = parseInt(this.value);
    contrastValue.textContent = val + '%';
    currentParams.contrast = val;
  });

  opacitySlider.addEventListener('input', function () {
    const val = parseFloat(this.value);
    opacityValue.textContent = val.toFixed(2);
    currentParams.fontOpacity = val;
  });

  bodyBgColor.addEventListener('change', function () {
    currentParams.bodyBackground = this.value;
  });

  canvasBgColor.addEventListener('change', function () {
    currentParams.canvasBackground = this.value;
  });

  // ── Buttons ─────────────────────────────

  confirmBtn.addEventListener('click', function () {
    if (pdfDoc) {
      renderPage(currentPage);
    }
    saveConfigToVSCode();
  });

  resetBtn.addEventListener('click', function () {
    applyConfig(savedParams);
    updateDynamicStyles();
    if (pdfDoc) {
      renderPage(currentPage);
    }
  });

  toggleBtn.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    currentParams.darkModeEnabled = document.body.classList.contains('dark-mode');
    toggleBtn.textContent = currentParams.darkModeEnabled ? '☀ Light Mode' : '🌙 Dark Mode';
    updateDynamicStyles();
    vscode.postMessage({ type: 'setDarkMode', enabled: currentParams.darkModeEnabled });
  });

  prevBtn.addEventListener('click', function () {
    if (pdfDoc && currentPage > 1) {
      currentPage--;
      pageInput.value = currentPage;
      renderPage(currentPage);
    }
  });

  nextBtn.addEventListener('click', function () {
    if (pdfDoc && currentPage < totalPages) {
      currentPage++;
      pageInput.value = currentPage;
      renderPage(currentPage);
    }
  });

  pageInput.addEventListener('change', function () {
    const targetPage = parseInt(this.value);
    if (pdfDoc && !isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      currentPage = targetPage;
      renderPage(currentPage);
    } else {
      pageInput.value = currentPage;
    }
  });

  // ── Panel Toggles ──────────────────────

  panelToggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    // Close the other panel
    if (outlinePanel.classList.contains('expanded')) {
      outlinePanel.classList.add('collapsed');
      outlinePanel.classList.remove('expanded');
    }
    paramPanel.classList.toggle('collapsed');
    paramPanel.classList.toggle('expanded');
  });

  outlineToggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    // Close the other panel
    if (paramPanel.classList.contains('expanded')) {
      paramPanel.classList.add('collapsed');
      paramPanel.classList.remove('expanded');
    }
    outlinePanel.classList.toggle('collapsed');
    outlinePanel.classList.toggle('expanded');
    if (outlinePanel.classList.contains('expanded') && pdfDoc) {
      if (outlineData.length > 0) {
        highlightAndScrollToCurrentPage();
      } else {
        getPDFOutline().then(function () {
          highlightAndScrollToCurrentPage();
        });
      }
    }
  });

  // 📂 Open file button
  fileSelectBtn.addEventListener('click', function () {
    vscode.postMessage({ type: 'openFile' });
  });

  // ── Click outside to dismiss ────────────

  document.body.addEventListener('click', function (e) {
    if (!paramPanel.contains(e.target) && e.target !== panelToggleBtn) {
      if (paramPanel.classList.contains('expanded')) {
        paramPanel.classList.add('collapsed');
        paramPanel.classList.remove('expanded');
      }
    }
    if (!outlinePanel.contains(e.target) && e.target !== outlineToggleBtn) {
      if (outlinePanel.classList.contains('expanded')) {
        outlinePanel.classList.add('collapsed');
        outlinePanel.classList.remove('expanded');
      }
    }
  });

  paramPanel.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  outlinePanel.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // ── Keyboard shortcuts ─────────────────

  document.addEventListener('keydown', function (e) {
    // Only respond when not focused in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevBtn.click();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextBtn.click();
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleBtn.click();
        } else if (window.__vookMode === 'panel' && panelZoom > 1.05) {
          e.preventDefault();
          pdfContainer.scrollLeft += currentParams.wasdStep;
        }
        break;
      // ── WASD pan (panel mode, zoomed in) ──
      case 'w':
        if (window.__vookMode === 'panel' && panelZoom > 1.05) {
          e.preventDefault();
          pdfContainer.scrollTop -= currentParams.wasdStep;
        }
        break;
      case 'a':
        if (window.__vookMode === 'panel' && panelZoom > 1.05) {
          e.preventDefault();
          pdfContainer.scrollLeft -= currentParams.wasdStep;
        }
        break;
      case 's':
        if (window.__vookMode === 'panel' && panelZoom > 1.05) {
          e.preventDefault();
          pdfContainer.scrollTop += currentParams.wasdStep;
        }
        break;
      // ── Panel mode: page nav + zoom (Z/X/Q/E) ──
      case 'z':
        if (window.__vookMode === 'panel') {
          e.preventDefault();
          prevBtn.click();
        }
        break;
      case 'x':
        if (window.__vookMode === 'panel') {
          e.preventDefault();
          nextBtn.click();
        }
        break;
      case 'q':
        if (window.__vookMode === 'panel') {
          e.preventDefault();
          applyPanelZoom(panelZoom - 0.15);
        }
        break;
      case 'e':
        if (window.__vookMode === 'panel') {
          e.preventDefault();
          applyPanelZoom(panelZoom + 0.15);
        }
        break;
    }
  });

  // ── VS Code Message Handler ─────────────

  window.addEventListener('message', function (event) {
    const msg = event.data;

    switch (msg.type) {

      case 'openPdfData':
        // Set pdf.js worker path
        pdfjsLib.GlobalWorkerOptions.workerSrc = window.__pdfWorkerSrc;
        // Decode base64 → Uint8Array, pass to pdf.js
        const pdfBytes = base64ToUint8(msg.data);
        initPDF(null, pdfBytes);
        break;

      case 'initConfig':
        applyConfig(msg.config);
        savedParams = Object.assign({}, currentParams);
        // Enable dark mode by default
        if (currentParams.darkModeEnabled) {
          document.body.classList.add('dark-mode');
          toggleBtn.textContent = '☀ Light Mode';
        }
        break;

      case 'error':
        pdfContainer.innerHTML = '<div style="text-align:center;padding:60px 0;color:#c00;">' + msg.message + '</div>';
        break;
    }
  });

  // ── Magnifier + Zoom + Pan (Panel Mode) ──
  let magnifierEnabled = false;
  let magHeight = 100;  // fixed height of the bottom strip
  const magnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
  let panelZoom = 1.0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0, scrollStartX = 0, scrollStartY = 0;

  // Helper: get the currently visible canvas element
  function getCurrentCanvas() {
    var pc = document.querySelector('.pdf-page');
    return pc ? pc.querySelector('canvas') : null;
  }

  // Magnifier toggle button
  if (magnifierToggleBtn) {
    magnifierToggleBtn.addEventListener('click', function () {
      magnifierEnabled = !magnifierEnabled;
      if (magnifierEnabled) {
        magnifierToggleBtn.classList.add('active');
        pdfContainer.style.cursor = 'crosshair';
        magnifier.style.display = 'block';
      } else {
        magnifierToggleBtn.classList.remove('active');
        pdfContainer.style.cursor = panelZoom > 1 ? 'grab' : '';
        magnifier.style.display = 'none';
      }
    });
  }

  // Magnifier: mousemove on PDF container → show strip at bottom
  pdfContainer.addEventListener('mousemove', function (e) {
    if (!magnifierEnabled || magnifierCtx === null) return;

    var canvas = getCurrentCanvas();
    if (!canvas) return;

    var rect = canvas.getBoundingClientRect();
    // Map visual (CSS) coordinates → canvas pixel coordinates
    var scaleX = canvas.width / (rect.width || canvas.width);
    var scaleY = canvas.height / (rect.height || canvas.height);
    var cx = (e.clientX - rect.left) * scaleX;
    var cy = (e.clientY - rect.top) * scaleY;

    // Size the magnifier canvas to fill the strip
    var magWidth = magnifier.offsetWidth || 300;
    magnifierCanvas.width = magWidth;
    magnifierCanvas.height = magHeight;
    magnifierCtx.clearRect(0, 0, magWidth, magHeight);

    // Source region: horizontal strip on original canvas, centered at cursor Y
    var srcW = magWidth / currentParams.magnifierZoomLevel;
    var srcH = magHeight / currentParams.magnifierZoomLevel;
    var sx = Math.max(0, cx - srcW / 2);
    var sy = Math.max(0, cy - srcH / 2);
    // Clamp source to canvas bounds
    var sw = Math.min(srcW, canvas.width - sx);
    var sh = Math.min(srcH, canvas.height - sy);

    // Draw the strip magnified to fill the bottom rectangle
    magnifierCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, magWidth, magHeight);

    // Apply same dark-mode filter + opacity
    if (document.body.classList.contains('dark-mode')) {
      magnifierCanvas.style.filter = [
        'invert(' + currentParams.invert + '%)',
        'hue-rotate(' + currentParams.hue + 'deg)',
        'grayscale(' + currentParams.grayscale + '%)',
        'brightness(' + currentParams.brightness + '%)',
        'contrast(' + currentParams.contrast + '%)',
      ].join(' ');
      magnifierCanvas.style.opacity = currentParams.fontOpacity;
      magnifier.style.backgroundColor = currentParams.canvasBackground;
    } else {
      magnifierCanvas.style.filter = '';
      magnifierCanvas.style.opacity = '';
      magnifier.style.backgroundColor = '';
    }
  });

  pdfContainer.addEventListener('mouseleave', function () {
    // Keep the magnifier visible even when mouse leaves — show last frame
    // (more natural for fixed bottom strip)
  });

  // Apply zoom to current canvas (shared by wheel + keyboard shortcuts)
  function applyPanelZoom(zoom) {
    panelZoom = Math.max(0.5, Math.min(4.0, zoom));
    var canvas = getCurrentCanvas();
    if (canvas) {
      canvas.style.transform = 'scale(' + panelZoom + ')';
      canvas.style.transformOrigin = 'top left';
    }
    if (panelZoom > 1.05) {
      pdfContainer.style.overflow = 'auto';
    } else {
      pdfContainer.style.overflowX = 'hidden';
      pdfContainer.style.overflowY = 'auto';
    }
    if (panelZoom <= 1.05 && !magnifierEnabled) {
      pdfContainer.style.cursor = '';
    } else if (panelZoom > 1.05 && !magnifierEnabled) {
      pdfContainer.style.cursor = 'grab';
    }
  }

  // Ctrl+Wheel zoom (panel mode only)
  if (window.__vookMode === 'panel') {
    pdfContainer.addEventListener('wheel', function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? -0.15 : 0.15;
        applyPanelZoom(panelZoom + delta);
      }
    }, { passive: false });

    // Drag to pan (when zoomed in)
    pdfContainer.addEventListener('mousedown', function (e) {
      if (magnifierEnabled) return;
      if (panelZoom > 1.05) {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        scrollStartX = pdfContainer.scrollLeft;
        scrollStartY = pdfContainer.scrollTop;
        pdfContainer.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      pdfContainer.scrollLeft = scrollStartX - dx;
      pdfContainer.scrollTop = scrollStartY - dy;
    });

    document.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        pdfContainer.style.cursor = panelZoom > 1.05 ? 'grab' : '';
      }
    });
  }

  // ── Panel mode setup ────────────────────
  if (window.__vookMode === 'panel') {
    document.body.classList.add('panel-mode');
    // Reduce default scale for narrow sidebar
    if (currentParams.scale > 1.5) {
      currentParams.scale = 1.2;
      scaleSlider.value = '1.2';
      scaleValue.textContent = '1.2';
    }
  }

  // ── Notify extension: webview is ready ──
  vscode.postMessage({ type: 'ready' });

})();
