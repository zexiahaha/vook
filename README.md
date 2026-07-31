# Vook — PDF Ebook Reader for VS Code

Read PDF ebooks directly in your VS Code editor with dark mode, customizable display parameters, and table of contents navigation.

![Vook screenshot](images/screenshot.png)

## ✨ Features

### Editor Mode (Main Area)
- **📖 PDF Reading** — Open `.pdf` files in the main editor area, just like code files
- **🌙 Dark Mode** — CSS filter-based dark mode, perfect for scanned PDFs (white paper → dark background)
- **🎨 Customizable Display** — Fine-tune 10+ parameters (scale, margin, invert, hue, grayscale, brightness, contrast, etc.)
- **📚 Table of Contents** — PDF outline navigation with auto-highlight current chapter
- **💾 Persistent Settings** — All parameters saved to VS Code configuration

### Panel Mode (Sidebar)
- **🪟 Low-Profile Reading** — Read PDF in the Explorer sidebar, hidden in plain sight
- **🔍 Magnifier** — Bottom strip shows 2.5× magnified view following your cursor
- **🔎 Ctrl+Scroll Zoom** — 0.5×–4× with drag-to-pan when zoomed in
- **🎮 WASD Pan** — Keyboard panning when zoomed: W/A/S/D = up/left/down/right
- **🔄 Mode Switching** — One-click switch between editor (full-screen) and panel (sidebar)

## 🚀 Quick Start

1. Install the extension
2. Double-click any `.pdf` file in the explorer → opens in editor mode
3. Or press `Ctrl+Shift+P` → **Vook: Open PDF File**
4. For sidebar reading: `Ctrl+Shift+P` → **Vook: Open PDF in Side Panel**

## ⌨ Keyboard Shortcuts

### Editor Mode
| Shortcut | Action |
|---|---|
| `←` | Previous page |
| `→` | Next page |
| `Ctrl+D` / `Cmd+D` | Toggle dark mode |

### Panel Mode
| Shortcut | Action |
|---|---|
| `Z` | Previous page |
| `X` | Next page |
| `Q` | Zoom out |
| `E` | Zoom in |
| `W` / `A` / `S` / `D` | Pan up / left / down / right (when zoomed) |
| `Ctrl+Scroll` | Zoom in/out |
| `F` | Toggle collapse/restore panel content (panic button) |

## ⚙️ Settings

All settings are accessible via VS Code Settings (`Ctrl+,`) → search "Vook", or click the ⚙️ button in the reader to adjust in real-time.

### Display
| Setting | Default | Description |
|---|---|---|
| `vook.scale` | `2.0` | PDF rendering scale |
| `vook.marginLeft` | `-1` | Left margin, -1 = auto center |

### Dark Mode
| Setting | Default | Description |
|---|---|---|
| `vook.darkMode.enabled` | `true` | Enable dark mode by default |
| `vook.darkMode.invert` | `80` | Invert level (0-100) |
| `vook.darkMode.hue` | `180` | Hue rotation (0-360°) |
| `vook.darkMode.grayscale` | `10` | Grayscale (0-100) |
| `vook.darkMode.brightness` | `85` | Brightness (0-100) |
| `vook.darkMode.contrast` | `90` | Contrast (0-100) |
| `vook.darkMode.fontOpacity` | `1.0` | Font opacity (0.1-1.0) |

### Panel Mode
| Setting | Default | Description |
|---|---|---|
| `vook.panelLabel` | `"TODO"` | Panel name shown in Explorer sidebar |
| `vook.magnifier.zoomLevel` | `2.5` | Magnifier zoom level (1.5–5.0) |
| `vook.panel.wasdStep` | `30` | WASD pan step size in pixels (5–200) |

## 🏗 How It Works

Vook uses [pdf.js](https://github.com/mozilla/pdf.js) (Mozilla) to render PDF pages. Dark mode uses CSS filters (`invert` + `hue-rotate` + `brightness` + `contrast`) to transform scanned PDF pages — no pixel-level processing needed for most documents.

## 📦 Coming Soon

- EPUB support
- Text-layer rendering for text-based PDFs
- Bookmarks and highlights

## 📄 License

MIT
