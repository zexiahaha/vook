# Vook — PDF Ebook Reader for VS Code

Read PDF ebooks directly in your VS Code editor with dark mode, customizable display parameters, and table of contents navigation.

![Vook screenshot](images/screenshot.png)

## ✨ Features

- **📖 PDF Reading** — Open `.pdf` files in the main editor area, just like code files
- **🌙 Dark Mode** — CSS filter-based dark mode, perfect for scanned PDFs (white paper → dark background)
- **🎨 Customizable Display** — Fine-tune 10+ parameters:
  - Scale ratio (0.5× – 4.0×)
  - Left margin (auto-center or fixed pixels)
  - Page & canvas background colors
  - Invert level, hue rotation, grayscale
  - Brightness, contrast
  - Font/text opacity
- **📚 Table of Contents** — PDF outline navigation with auto-highlight current chapter
- **💾 Persistent Settings** — All parameters saved to VS Code configuration
- **⌨ Keyboard Shortcuts** — Arrow keys to flip pages, Ctrl+D to toggle dark mode

## 🚀 Quick Start

1. Install the extension
2. Double-click any `.pdf` file in the explorer
3. Or press `Ctrl+Shift+P` → **Vook: Open PDF File**

## ⌨ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `←` | Previous page |
| `→` | Next page |
| `Ctrl+D` / `Cmd+D` | Toggle dark mode |

## ⚙️ Settings

All settings are accessible via VS Code Settings (`Ctrl+,`) → search "Vook", or click the ⚙️ button in the reader to adjust in real-time.

| Setting | Default | Description |
|---|---|---|
| `vook.scale` | `2.0` | PDF rendering scale |
| `vook.marginLeft` | `-1` | Left margin, -1 = auto center |
| `vook.darkMode.enabled` | `true` | Enable dark mode by default |
| `vook.darkMode.invert` | `80` | Invert level (0-100) |
| `vook.darkMode.hue` | `180` | Hue rotation (0-360°) |
| `vook.darkMode.grayscale` | `10` | Grayscale (0-100) |
| `vook.darkMode.brightness` | `85` | Brightness (0-100) |
| `vook.darkMode.contrast` | `90` | Contrast (0-100) |
| `vook.darkMode.fontOpacity` | `1.0` | Font opacity (0.1-1.0) |

## 🏗 How It Works

Vook uses [pdf.js](https://github.com/mozilla/pdf.js) (Mozilla) to render PDF pages. Dark mode uses CSS filters (`invert` + `hue-rotate` + `brightness` + `contrast`) to transform scanned PDF pages — no pixel-level processing needed for most documents.

## 📦 Coming Soon

- EPUB support
- Text-layer rendering for text-based PDFs
- Bookmarks and highlights

## 📄 License

MIT
