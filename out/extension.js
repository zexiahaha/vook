"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
// ────────────────────────────────────────
// Shared state
// ────────────────────────────────────────
let currentPdfUri = null;
let currentPdfName = '';
// ────────────────────────────────────────
// Shared: build HTML for a webview
// ────────────────────────────────────────
function buildHtml(webview, context, mode) {
    const mediaDir = vscode.Uri.joinPath(context.extensionUri, 'media');
    const cmapsDir = vscode.Uri.joinPath(context.extensionUri, 'cmaps');
    const pdfJsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaDir, 'pdf.mjs'));
    const pdfWorkerUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaDir, 'pdf.worker.mjs'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaDir, 'style.css'));
    const readerUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaDir, 'reader.js'));
    const cmapUri = webview.asWebviewUri(cmapsDir);
    const cspSource = webview.cspSource;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 script-src 'unsafe-inline' ${cspSource};
                 style-src 'unsafe-inline' ${cspSource};
                 img-src data: blob: ${cspSource};
                 worker-src ${cspSource};
                 connect-src blob: ${cspSource};
                 font-src ${cspSource};">
  <title>Vook PDF Viewer</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="pdf-container"></div>

  <div id="outline-toggle-btn" title="Table of Contents">📚</div>
  <div id="outline-panel" class="collapsed"></div>

  <div id="file-select-btn" title="Open PDF File">📂</div>

  <div id="panel-toggle-btn" title="Display Settings">⚙️</div>

  <div id="param-panel" class="collapsed">
    <h4 style="margin-bottom:10px">Display Settings</h4>

    <div class="param-item">
      <label>Scale Ratio: <span class="param-value" id="scale-value">2.0</span></label>
      <input type="range" id="scale-slider" min="0.5" max="4.0" step="0.1" value="2.0">
    </div>

    <div class="param-item">
      <label>Left Margin: <span class="param-value" id="margin-left-value">auto</span></label>
      <input type="range" id="margin-left-slider" min="-1" max="1000" step="10" value="-1">
    </div>

    <div class="param-item">
      <label>Page Background (Dark Mode):</label>
      <input type="color" id="body-bg-color" value="#0c0c0c">
    </div>

    <div class="param-item">
      <label>Canvas Background (Dark Mode):</label>
      <input type="color" id="canvas-bg-color" value="#1a1a1a">
    </div>

    <div class="param-item">
      <label>Invert Level: <span class="param-value" id="invert-value">80%</span></label>
      <input type="range" id="invert-slider" min="0" max="100" step="1" value="80">
    </div>

    <div class="param-item">
      <label>Hue Rotation: <span class="param-value" id="hue-value">180deg</span></label>
      <input type="range" id="hue-slider" min="0" max="360" step="1" value="180">
    </div>

    <div class="param-item">
      <label>Grayscale: <span class="param-value" id="gray-value">10%</span></label>
      <input type="range" id="gray-slider" min="0" max="100" step="1" value="10">
    </div>

    <div class="param-item">
      <label>Brightness: <span class="param-value" id="bright-value">85%</span></label>
      <input type="range" id="bright-slider" min="0" max="100" step="1" value="85">
    </div>

    <div class="param-item">
      <label>Contrast: <span class="param-value" id="contrast-value">90%</span></label>
      <input type="range" id="contrast-slider" min="0" max="100" step="1" value="90">
    </div>

    <div class="param-item">
      <label>Font Opacity: <span class="param-value" id="opacity-value">1.0</span></label>
      <input type="range" id="opacity-slider" min="0.1" max="1.0" step="0.05" value="1.0">
    </div>

    <button id="confirm-btn">Apply</button>
    <button id="reset-btn">Revert</button>
  </div>

  <div class="bottom-bar">
    <button id="magnifier-toggle" title="Toggle Magnifier (click then hover over PDF)">🔍</button>
    <button id="toggle-mode">🌙 Dark Mode</button>
    <button id="prev-page">◀ Prev</button>
    <input type="text" id="page-input" value="1">
    <button id="next-page">Next ▶</button>
    <span id="total">/0</span>
  </div>

  <div id="magnifier" style="display:none">
    <canvas id="magnifier-canvas" width="160" height="160"></canvas>
  </div>

  <script>
    // VS Code API reference
    window.__vscode = acquireVsCodeApi();
    window.__pdfJsSrc = ${JSON.stringify(pdfJsUri.toString())};
    window.__pdfWorkerSrc = ${JSON.stringify(pdfWorkerUri.toString())};
    window.__cmapUrl = ${JSON.stringify(cmapUri.toString() + '/')};
    window.__vookMode = ${JSON.stringify(mode)};
  </script>
  <script type="module" src="${pdfJsUri}"></script>
  <script src="${readerUri}"></script>
</body>
</html>`;
}
function getProgress(context, fsPath) {
    const all = context.globalState.get('vook.bookProgress') || {};
    return all[fsPath] || null;
}
async function saveProgress(context, fsPath, page, zoom) {
    const all = context.globalState.get('vook.bookProgress') || {};
    all[fsPath] = { page, panelZoom: zoom, updatedAt: Date.now() };
    await context.globalState.update('vook.bookProgress', all);
}
async function removeProgress(context, fsPath) {
    const all = context.globalState.get('vook.bookProgress') || {};
    delete all[fsPath];
    await context.globalState.update('vook.bookProgress', all);
}
// Debounce timers for progress saves
let _progressTimer = null;
let _zoomTimer = null;
async function handleMessage(msg, webview, documentUri, context, loadPdfCallback) {
    switch (msg.type) {
        case 'openFile': {
            const result = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'PDF Files': ['pdf'] },
                title: 'Open PDF with Vook'
            });
            if (result && result[0]) {
                currentPdfUri = result[0];
                currentPdfName = path.basename(result[0].fsPath);
                await vscode.commands.executeCommand('vscode.openWith', result[0], 'vook.pdfViewer');
            }
            break;
        }
        case 'saveConfig': {
            const config = vscode.workspace.getConfiguration('vook');
            for (const [key, value] of Object.entries(msg.config)) {
                const clamped = clampConfigValue(key, value);
                await config.update(key, clamped, vscode.ConfigurationTarget.Global);
            }
            break;
        }
        case 'setDarkMode': {
            const config = vscode.workspace.getConfiguration('vook');
            await config.update('darkMode.enabled', msg.enabled, vscode.ConfigurationTarget.Global);
            break;
        }
        case 'ready': {
            const config = vscode.workspace.getConfiguration('vook');
            webview.postMessage({
                type: 'initConfig',
                config: serializeConfig(config)
            });
            // Determine which URI to load
            const uriToLoad = documentUri || currentPdfUri;
            if (uriToLoad) {
                try {
                    // Save last book + mode
                    await context.globalState.update('vook.lastBookUri', uriToLoad.fsPath);
                    await context.globalState.update('vook.lastMode', 'editor');
                    const pdfData = await vscode.workspace.fs.readFile(uriToLoad);
                    const base64 = uint8ToBase64(pdfData);
                    const progress = getProgress(context, uriToLoad.fsPath);
                    webview.postMessage({
                        type: 'openPdfData',
                        data: base64,
                        name: path.basename(uriToLoad.fsPath),
                        lastPage: progress ? progress.page : undefined,
                        lastZoom: progress ? progress.panelZoom : undefined
                    });
                }
                catch (err) {
                    webview.postMessage({
                        type: 'error',
                        message: 'Failed to read PDF file: ' + String(err)
                    });
                }
            }
            break;
        }
        case 'reportPage': {
            currentPdfUri = msg.uri ? vscode.Uri.parse(msg.uri) : currentPdfUri;
            break;
        }
        case 'reportProgress': {
            const uri = currentPdfUri;
            if (!uri)
                break;
            // debounce 500ms
            if (_progressTimer)
                clearTimeout(_progressTimer);
            _progressTimer = setTimeout(async () => {
                const all = context.globalState.get('vook.bookProgress') || {};
                const existing = all[uri.fsPath] || { panelZoom: 1.0, updatedAt: 0 };
                await saveProgress(context, uri.fsPath, msg.page, existing.panelZoom);
            }, 500);
            break;
        }
        case 'reportZoom': {
            const uri = currentPdfUri;
            if (!uri)
                break;
            // debounce 500ms
            if (_zoomTimer)
                clearTimeout(_zoomTimer);
            _zoomTimer = setTimeout(async () => {
                const all = context.globalState.get('vook.bookProgress') || {};
                const existing = all[uri.fsPath] || { page: 1, updatedAt: 0 };
                await saveProgress(context, uri.fsPath, existing.page, msg.zoom);
            }, 500);
            break;
        }
    }
}
// ────────────────────────────────────────
// Shared: config serialization
// ────────────────────────────────────────
// Clamp config values to safe ranges
function clampConfigValue(key, value) {
    if (typeof value !== 'number')
        return value;
    switch (key) {
        case 'scale': return Math.max(0.5, Math.min(4.0, value));
        case 'marginLeft': return Math.max(-1, Math.min(500, value));
        case 'darkMode.invert': return Math.max(0, Math.min(100, value));
        case 'darkMode.hue': return Math.max(0, Math.min(360, value));
        case 'darkMode.grayscale': return Math.max(0, Math.min(100, value));
        case 'darkMode.brightness': return Math.max(0, Math.min(100, value));
        case 'darkMode.contrast': return Math.max(0, Math.min(100, value));
        case 'darkMode.fontOpacity': return Math.max(0.1, Math.min(1.0, value));
        default: return value;
    }
}
function serializeConfig(config) {
    return {
        scale: config.get('scale', 2.0),
        marginLeft: config.get('marginLeft', -1),
        darkModeEnabled: config.get('darkMode.enabled', true),
        bodyBackground: config.get('darkMode.bodyBackground', '#0c0c0c'),
        canvasBackground: config.get('darkMode.canvasBackground', '#1a1a1a'),
        invert: config.get('darkMode.invert', 80),
        hue: config.get('darkMode.hue', 180),
        grayscale: config.get('darkMode.grayscale', 10),
        brightness: config.get('darkMode.brightness', 85),
        contrast: config.get('darkMode.contrast', 90),
        fontOpacity: config.get('darkMode.fontOpacity', 1.0),
        magnifierZoomLevel: config.get('magnifier.zoomLevel', 2.5),
        wasdStep: config.get('panel.wasdStep', 30),
    };
}
// ────────────────────────────────────────
// Shared: panel label from config
// ────────────────────────────────────────
function getPanelLabel() {
    const config = vscode.workspace.getConfiguration('vook');
    return config.get('panelLabel', 'TODO');
}
// ────────────────────────────────────────
// Shared: Uint8Array → base64
// ────────────────────────────────────────
function uint8ToBase64(data) {
    let binary = '';
    const len = data.length;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
}
// ────────────────────────────────────────
// Editor Provider (full-screen mode)
// ────────────────────────────────────────
class PdfViewerProvider {
    context;
    constructor(context) {
        this.context = context;
    }
    async openCustomDocument(uri) {
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewPanel) {
        const webview = webviewPanel.webview;
        webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                vscode.Uri.joinPath(this.context.extensionUri, 'cmaps'),
            ]
        };
        webview.html = buildHtml(webview, this.context, 'editor');
        webview.onDidReceiveMessage(async (msg) => {
            await handleMessage(msg, webview, document.uri, this.context);
        });
        currentPdfUri = document.uri;
        currentPdfName = path.basename(document.uri.fsPath);
        webviewPanel.title = currentPdfName;
    }
}
// ────────────────────────────────────────
// Panel Provider (sidebar mode)
// ────────────────────────────────────────
class PdfPanelProvider {
    context;
    _view = null;
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        const webview = webviewView.webview;
        webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                vscode.Uri.joinPath(this.context.extensionUri, 'cmaps'),
            ]
        };
        webview.html = buildHtml(webview, this.context, 'panel');
        webviewView.title = getPanelLabel();
        webviewView.description = '';
        webview.onDidReceiveMessage(async (msg) => {
            await handleMessage(msg, webview, currentPdfUri || undefined, this.context);
        });
    }
    async loadPdf(uri) {
        if (!this._view) {
            return;
        }
        currentPdfUri = uri;
        currentPdfName = path.basename(uri.fsPath);
        this._view.title = getPanelLabel();
        this._view.description = '';
        // Save last book + mode
        await this.context.globalState.update('vook.lastBookUri', uri.fsPath);
        await this.context.globalState.update('vook.lastMode', 'panel');
        try {
            const pdfData = await vscode.workspace.fs.readFile(uri);
            const base64 = uint8ToBase64(pdfData);
            const config = vscode.workspace.getConfiguration('vook');
            const progress = getProgress(this.context, uri.fsPath);
            this._view.webview.postMessage({
                type: 'initConfig',
                config: serializeConfig(config)
            });
            this._view.webview.postMessage({
                type: 'openPdfData',
                data: base64,
                name: currentPdfName,
                lastPage: progress ? progress.page : undefined,
                lastZoom: progress ? progress.panelZoom : undefined
            });
        }
        catch (err) {
            this._view.webview.postMessage({
                type: 'error',
                message: 'Failed to read PDF file: ' + String(err)
            });
        }
    }
    /** Expose the underlying view for focus commands */
    get view() {
        return this._view;
    }
}
// ────────────────────────────────────────
// Extension activation
// ────────────────────────────────────────
let panelProvider;
async function activate(context) {
    // ── Editor mode ──────────────────────────
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('vook.pdfViewer', new PdfViewerProvider(context), {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false
    }));
    // ── Panel mode ───────────────────────────
    panelProvider = new PdfPanelProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('vook.pdfPanel', panelProvider, {
        webviewOptions: { retainContextWhenHidden: true }
    }));
    // ── Command: Open PDF ────────────────────
    context.subscriptions.push(vscode.commands.registerCommand('vook.openPdf', async (fileUri) => {
        let targetUri = fileUri;
        if (!targetUri) {
            const result = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: { 'PDF Files': ['pdf'] },
                title: 'Open PDF with Vook'
            });
            if (!result || !result[0]) {
                return;
            }
            targetUri = result[0];
        }
        currentPdfUri = targetUri;
        currentPdfName = path.basename(targetUri.fsPath);
        await vscode.commands.executeCommand('vscode.openWith', targetUri, 'vook.pdfViewer');
    }));
    // ── Command: Switch to panel ─────────────
    context.subscriptions.push(vscode.commands.registerCommand('vook.switchToPanel', async () => {
        if (!currentPdfUri) {
            vscode.window.showWarningMessage('Vook: No PDF is currently open.');
            return;
        }
        // Close the active editor if it's showing this PDF
        const tabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
        for (const tab of tabs) {
            const input = tab.input;
            if (input && typeof input === 'object' && 'uri' in input) {
                const tabInput = input;
                if (tabInput.uri && tabInput.uri.fsPath === currentPdfUri.fsPath) {
                    await vscode.window.tabGroups.close(tab);
                    break;
                }
            }
        }
        // Focus the panel view and load the PDF
        await vscode.commands.executeCommand('vook.pdfPanel.focus');
        await panelProvider.loadPdf(currentPdfUri);
    }));
    // ── Command: Switch to editor ────────────
    context.subscriptions.push(vscode.commands.registerCommand('vook.switchToEditor', async () => {
        if (!currentPdfUri) {
            vscode.window.showWarningMessage('Vook: No PDF is currently open.');
            return;
        }
        await vscode.commands.executeCommand('vscode.openWith', currentPdfUri, 'vook.pdfViewer');
    }));
    // ── Open panel command ───────────────────
    context.subscriptions.push(vscode.commands.registerCommand('vook.openPdfPanel', async () => {
        const result = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'PDF Files': ['pdf'] },
            title: 'Open PDF in Vook Panel'
        });
        if (!result || !result[0]) {
            return;
        }
        currentPdfUri = result[0];
        currentPdfName = path.basename(result[0].fsPath);
        // Show the explorer sidebar if not visible, then focus the panel
        await vscode.commands.executeCommand('workbench.view.explorer');
        await panelProvider.loadPdf(currentPdfUri);
    }));
    // ── Auto-open last book in panel on startup ──
    const lastUri = context.globalState.get('vook.lastBookUri');
    if (lastUri) {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(lastUri));
        }
        catch (e) {
            if (e?.code === 'FileNotFound') {
                // File deleted — clean up
                await context.globalState.update('vook.lastBookUri', undefined);
                await removeProgress(context, lastUri);
            }
            return; // skip auto-open on any stat error
        }
        // File exists — open in panel
        try {
            const tabs = vscode.window.tabGroups.all.flatMap(g => g.tabs);
            for (const tab of tabs) {
                const input = tab.input;
                if (input?.uri?.fsPath === lastUri) {
                    await vscode.window.tabGroups.close(tab);
                }
            }
        }
        catch { /* tab close failure is non-fatal */ }
        currentPdfUri = vscode.Uri.file(lastUri);
        currentPdfName = path.basename(lastUri);
        await vscode.commands.executeCommand('workbench.view.explorer');
        await panelProvider.loadPdf(currentPdfUri);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map