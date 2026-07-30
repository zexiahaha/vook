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
// PDF Viewer Provider
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
        // ── Webview options ──────────────────
        webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                vscode.Uri.joinPath(this.context.extensionUri, 'cmaps'),
            ]
        };
        // ── Build HTML with injected URIs ────
        webview.html = this.buildHtml(webview);
        // ── Listen for messages from webview ─
        webview.onDidReceiveMessage(async (msg) => {
            switch (msg.type) {
                // User clicked 📂 → open system file picker
                case 'openFile': {
                    const result = await vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: { 'PDF Files': ['pdf'] },
                        title: 'Open PDF with Vook'
                    });
                    if (result && result[0]) {
                        await vscode.commands.executeCommand('vscode.openWith', result[0], 'vook.pdfViewer');
                    }
                    break;
                }
                // User adjusted params → persist to VS Code config
                case 'saveConfig': {
                    const config = vscode.workspace.getConfiguration('vook');
                    for (const [key, value] of Object.entries(msg.config)) {
                        await config.update(key, value, vscode.ConfigurationTarget.Global);
                    }
                    break;
                }
                // User toggled dark mode → persist state
                case 'setDarkMode': {
                    const config = vscode.workspace.getConfiguration('vook');
                    await config.update('darkMode.enabled', msg.enabled, vscode.ConfigurationTarget.Global);
                    break;
                }
                // Webview ready → read PDF binary + send config
                case 'ready': {
                    const config = vscode.workspace.getConfiguration('vook');
                    // Send config first so UI initializes early
                    webview.postMessage({
                        type: 'initConfig',
                        config: this.serializeConfig(config)
                    });
                    // Read file binary, base64-encode, send to webview
                    try {
                        const pdfData = await vscode.workspace.fs.readFile(document.uri);
                        const base64 = this.uint8ToBase64(pdfData);
                        webview.postMessage({
                            type: 'openPdfData',
                            data: base64,
                            name: path.basename(document.uri.fsPath)
                        });
                    }
                    catch (err) {
                        webview.postMessage({
                            type: 'error',
                            message: 'Failed to read PDF file: ' + String(err)
                        });
                    }
                    break;
                }
            }
        });
        // ── Update tab title ───────────────────
        webviewPanel.title = path.basename(document.uri.fsPath);
    }
    // ── Build webview HTML ──────────────────
    buildHtml(webview) {
        const mediaDir = vscode.Uri.joinPath(this.context.extensionUri, 'media');
        const cmapsDir = vscode.Uri.joinPath(this.context.extensionUri, 'cmaps');
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
    <button id="reset-btn">Reset</button>
  </div>

  <div class="bottom-bar">
    <button id="toggle-mode">🌙 Dark Mode</button>
    <button id="prev-page">◀ Prev</button>
    <input type="text" id="page-input" value="1">
    <button id="next-page">Next ▶</button>
    <span id="total">/0</span>
  </div>

  <script>
    // VS Code API reference
    window.__vscode = acquireVsCodeApi();
    window.__pdfJsSrc = ${JSON.stringify(pdfJsUri.toString())};
    window.__pdfWorkerSrc = ${JSON.stringify(pdfWorkerUri.toString())};
    window.__cmapUrl = ${JSON.stringify(cmapUri.toString() + '/')};
  </script>
  <script type="module" src="${pdfJsUri}"></script>
  <script src="${readerUri}"></script>
</body>
</html>`;
    }
    // ── Serialize VS Code config to flat key-value ─
    serializeConfig(config) {
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
        };
    }
    // ── Uint8Array → base64 ─────────────────
    uint8ToBase64(data) {
        let binary = '';
        const len = data.length;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(data[i]);
        }
        return btoa(binary);
    }
}
// ────────────────────────────────────────
// Extension activation
// ────────────────────────────────────────
function activate(context) {
    // Register PDF custom editor provider
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('vook.pdfViewer', new PdfViewerProvider(context), {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false
    }));
    // Register "Open PDF" command
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
        await vscode.commands.executeCommand('vscode.openWith', targetUri, 'vook.pdfViewer');
    }));
}
function deactivate() { }
//# sourceMappingURL=extension.js.map