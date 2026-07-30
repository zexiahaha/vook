# Changelog

## [0.1.2] - 2026-07-30

### Added
- WASD keyboard panning in panel mode (W/A/S/D = up/left/down/right)
- `vook.panel.wasdStep` setting to configure WASD pan speed (5–200px, default 30)

### Changed
- WASD pan only activates when zoomed in (panelZoom > 1.05)

## [0.1.1] - 2026-07-30

### Added
- Side panel mode: read PDF in Explorer sidebar for a low-profile reading experience
- One-click switch between editor (full-screen) and panel (sidebar) modes
- Magnifier tool: bottom strip shows magnified view (2.5x) of cursor area, toggle with 🔍 button
- Ctrl+scroll zoom (0.5x–4x) and drag-to-pan in panel mode
- `vook.magnifier.zoomLevel` setting to configure magnifier zoom
- `vook.panelLabel` setting to disguise the panel name (default: "TODO")
- `vook.openPdfPanel` command to open PDF directly in side panel

### Changed
- Reset button now reverts to last-saved settings instead of factory defaults
- Button label changed from "Reset" to "Revert"

## [0.1.0] - 2026-07-30

### Added
- Initial release
- PDF reading via pdf.js in custom editor
- Dark mode with CSS filters (invert, hue-rotate, grayscale, brightness, contrast)
- Floating settings panel with 10+ adjustable parameters
- PDF outline/table of contents navigation
- Font opacity control
- VS Code configuration persistence
- Keyboard shortcuts (arrow keys, Ctrl+D)
- File picker dialog integration
