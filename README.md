# Bangle.js 2 Tools & UI Studio

A collection of developer tools and utilities for the **Bangle.js 2** open-source smartwatch, featuring a full **Visual UI Designer & Prototyping Studio** with an authentic 176×176 Memory LCD simulator, Espruino `Layout.js` engine, and Web Bluetooth direct-to-watch execution.

---

## ⌚ Bangle.js 2 UI Studio (`ui-designer/`)

The **Bangle.js 2 UI Studio** is an interactive, browser-based visual designer built specifically for the Bangle.js 2 hardware specifications and Espruino software APIs.

### 🌟 Key Features

1. **Pixel-Accurate 176×176 Watch Simulator**:
   - Faithful simulation of the **1.3" 176×176 LPM013M126 Memory LCD**.
   - **Authentic 3-Bit Color Mode**: Quantizes colors to the watch's physical 8-color palette (Black, Blue, Green, Cyan, Red, Magenta, Yellow, White).
   - **Interactive Hardware Button (BTN1)**: Clickable side button with press animations and event handling.
   - **Subtle Memory LCD Pixel Grid**: Toggle reflective LCD texture.
   - **Zoom Levels**: Instant 1x (176px), 2x (352px), and 3x (528px) scaling.
   - **Live Drag-and-Drop Element Repositioning**:
     - Click and drag any element directly on the watch screen.
     - Live visual guides: glowing container drop target highlight, circular insertion indicator line, and a floating element preview card following your cursor.
     - Automatically updates container hierarchies, sibling orders, and alignment (`halign`/`valign`).
   - **Hierarchy Tree Drag-and-Drop & Reordering**:
     - Drag items in the sidebar tree, or use the `▲` Move Up and `▼` Move Down buttons.
     - 1-click **Wrap in Row (`h`)** or **Wrap in Column (`v`)**.
   - **System Widgets Bar (24px)**: Live toggle to test layouts with (`Bangle.appRect = 176×152`) or without (`176×176`) top status widgets.
   - **Debug Bounding Boxes (`layout.debug()`)**: Live color-coded outlines of container bounds, spacing, and element padding.

2. **Official Espruino `Layout.js` Engine**:
   - Complete browser simulation of Espruino's official layout algorithm.
   - Container types: Vertical (`v`) and Horizontal (`h`) flex boxes with proportional `fillx` and `filly` space distribution.
   - Elements: Text (`txt`), Buttons (`btn`), Icons/Images (`img`), Custom graphics renderers (`custom`), and Blank spacers (`""`).
   - Sizing & Align: `halign` (left/center/right), `valign` (top/center/bottom), fixed `width`/`height`, and `pad`.
   - Fonts: Exact simulation of built-in Espruino bitmap fonts (`6x8`, `6x8:2`, `6x8:3`, `12x20`, `12x20:2`), Vector fonts (`Vector:14`, `Vector:20`, etc.), and screen height percentages (`"20%"`, `"30%"`).
   - Text wrapping (`wrap: true`) and 90°/180°/270° rotation (`r`).

3. **Graphical Menu Builder (`E.showMenu()`)**:
   - Visual editor and interactive simulator for Bangle settings and graphical menus.
   - Interactive booleans (On/Off toggles), numeric steppers (with min, max, step), and action buttons.
   - Drag/tap scroll testing with realistic title bar and value formatters.

4. **Built-in Smartwatch Icons & Bitmap Converter**:
   - Pre-packaged 1-bpp bitmap icons: Battery (full, charging), Heart Rate (HRM), Steps / Shoe, Bluetooth, Clock / Alarm, Settings / Gear, Play / Pause / Skip, Sun / Weather, and Warning / Alert.
   - Automatic generation of Espruino-native `atob("...")` bitmap strings.

5. **Ready-to-Use Starter Templates**:
   - **Digital Watch Face**: Big time, date, step count, and heart rate complications.
   - **Fitness Dashboard**: 2×2 sensor grid (HRM bpm, steps, calories) and workout action button.
   - **Media Controller**: Song title, artist, progress bar, and play/pause/skip buttons.
   - **Stopwatch / Lap Timer**: Clean high-contrast counter with start/stop and lap reset controls.
   - **Interactive Counter**: Tap counter with big touch buttons.
   - **Confirmation Dialog**: Modal prompt with alert symbol, wrapped text, and Confirm/Cancel actions.
   - **Weather Card**: City header, condition icon, big temperature, and humidity/wind stats.

6. **Espruino Code Generation & Export**:
   - Generates clean, production-ready Espruino JavaScript code.
   - 1-click **Copy to Clipboard**.
   - 1-click **Download `.app.js`**.
   - 1-click **Open in Espruino Web IDE** (`espruino.com/ide`).
   - **App Metadata Generator** (`metadata.json`, `app.info`) for the official BangleApps Store.

7. **Code Importer**:
   - Paste existing Bangle.js `new Layout({...})` JavaScript code or JSON to load and edit visually.

8. **Web Bluetooth Direct Upload**:
   - Uses the browser's Web Bluetooth API (Nordic UART Service `6e400001-b5a3-f393-e0a9-e50e24dcca9e`).
   - One-click upload directly into watch RAM via BLE REPL for instant testing on real hardware!

---

## 🚀 Quick Start

### Option 1: Zero-Dependency Python Server (Recommended)

Run the included launcher script:

```bash
./serve.py
# or
python3 serve.py
```

This will automatically start a local server on port `8080` and open `http://localhost:8080/ui-designer/index.html` in your default web browser.

### Option 2: Open Directly in Browser

Simply open `ui-designer/index.html` directly in Google Chrome, Microsoft Edge, or Chromium:

```bash
xdg-open ui-designer/index.html
```

*(Note: Web Bluetooth requires an HTTPS or localhost origin, so use `./serve.py` when testing live Web Bluetooth uploading).*

---

## 🧪 Automated Testing

A unit test suite verifying the layout engine, sizing calculations, icon encoding, code generation, and code importing is included:

```bash
gjs ui-designer/test/test-engine.js
```

---

## 📂 Project Structure

```text
banglejs2-tools/
├── README.md                      # Project documentation and quick start guide
├── index.html                     # Root redirect to UI Studio
├── serve.py                       # Zero-dependency local server and launcher
├── Layout.js                      # Official Espruino Layout.js reference
├── ui-designer/                   # Bangle.js 2 UI Studio application
│   ├── index.html                 # Main single-page web app
│   ├── css/
│   │   └── app.css                # Polished dark theme, watch casing, and styling
│   ├── js/
│   │   ├── app.js                 # Studio controller, UI bindings, and state
│   │   ├── layout-engine.js       # Espruino Layout.js simulation engine
│   │   ├── bangle-display.js      # 176×176 Canvas renderer, 3-bit LCD & widgets
│   │   ├── menu-engine.js         # E.showMenu interactive simulator
│   │   ├── icons.js               # Smartwatch icon library & bitmap encoder
│   │   ├── templates.js           # Pre-built watchfaces, dashboards, and prompts
│   │   ├── code-generator.js      # Clean Espruino JS code & metadata generator
│   │   ├── code-importer.js       # Layout.js code parser and importer
│   │   └── web-bluetooth.js       # Web Bluetooth Nordic UART live uploader
│   └── test/
│       └── test-engine.js         # Automated test suite (executable with gjs)
└── context/BangleJS2/             # Consolidated offline Bangle.js 2 documentation
    ├── docs/                      # Official API references, tutorials, and specs
    └── scrape_banglejs2_docs.py   # Documentation scraper script
```

---

## 📚 Documentation & References

Comprehensive offline documentation for Bangle.js 2 is available in the [`context/BangleJS2/`](context/BangleJS2/) directory:
* [Bangle.js 2 Overview & Hardware Guide](context/BangleJS2/docs/banglejs2_overview.md)
* [Software API Reference (700+ methods)](context/BangleJS2/docs/banglejs2_api_reference.md)
* [Layout Library Guide](context/BangleJS2/docs/tutorials/layout_library.md)
* [Watch Faces Tutorial](context/BangleJS2/docs/tutorials/clock_faces.md)
* [Widgets Guide](context/BangleJS2/docs/tutorials/widgets.md)
* [TypeScript Type Definitions](context/BangleJS2/docs/types/)

## ⌚ Bangle.js 2 UI Studio (`ui-designer/`)

The **Bangle.js 2 UI Studio** is an interactive, browser-based visual designer built specifically for the Bangle.js 2 hardware specifications and Espruino software APIs.

### 🌟 Key Features

1. **Pixel-Accurate 176×176 Watch Simulator**:
   - Faithful simulation of the **1.3" 176×176 LPM013M126 Memory LCD**.
   - **Authentic 3-Bit Color Mode**: Quantizes colors to the watch's physical 8-color palette (Black, Blue, Green, Cyan, Red, Magenta, Yellow, White).
   - **Interactive Hardware Button (BTN1)**: Clickable side button with press animations and event handling.
   - **Subtle Memory LCD Pixel Grid**: Toggle reflective LCD texture.
   - **Zoom Levels**: Instant 1x (176px), 2x (352px), and 3x (528px) scaling.
   - **System Widgets Bar (24px)**: Live toggle to test layouts with (`Bangle.appRect = 176×152`) or without (`176×176`) top status widgets.
   - **Debug Bounding Boxes (`layout.debug()`)**: Live color-coded outlines of container bounds, spacing, and element padding.

2. **Official Espruino `Layout.js` Engine**:
   - Complete browser simulation of Espruino's official layout algorithm.
   - Container types: Vertical (`v`) and Horizontal (`h`) flex boxes with proportional `fillx` and `filly` space distribution.
   - Elements: Text (`txt`), Buttons (`btn`), Icons/Images (`img`), Custom graphics renderers (`custom`), and Blank spacers (`""`).
   - Sizing & Align: `halign` (left/center/right), `valign` (top/center/bottom), fixed `width`/`height`, and `pad`.
   - Fonts: Exact simulation of built-in Espruino bitmap fonts (`6x8`, `6x8:2`, `6x8:3`, `12x20`, `12x20:2`), Vector fonts (`Vector:14`, `Vector:20`, etc.), and screen height percentages (`"20%"`, `"30%"`).
   - Text wrapping (`wrap: true`) and 90°/180°/270° rotation (`r`).

3. **Graphical Menu Builder (`E.showMenu()`)**:
   - Visual editor and interactive simulator for Bangle settings and graphical menus.
   - Interactive booleans (On/Off toggles), numeric steppers (with min, max, step), and action buttons.
   - Drag/tap scroll testing with realistic title bar and value formatters.

4. **Built-in Smartwatch Icons & Bitmap Converter**:
   - Pre-packaged 1-bpp bitmap icons: Battery (full, charging), Heart Rate (HRM), Steps / Shoe, Bluetooth, Clock / Alarm, Settings / Gear, Play / Pause / Skip, Sun / Weather, and Warning / Alert.
   - Automatic generation of Espruino-native `atob("...")` bitmap strings.

5. **Ready-to-Use Starter Templates**:
   - **Digital Watch Face**: Big time, date, step count, and heart rate complications.
   - **Fitness Dashboard**: 2×2 sensor grid (HRM bpm, steps, calories) and workout action button.
   - **Media Controller**: Song title, artist, progress bar, and play/pause/skip buttons.
   - **Stopwatch / Lap Timer**: Clean high-contrast counter with start/stop and lap reset controls.
   - **Interactive Counter**: Tap counter with big touch buttons.
   - **Confirmation Dialog**: Modal prompt with alert symbol, wrapped text, and Confirm/Cancel actions.
   - **Weather Card**: City header, condition icon, big temperature, and humidity/wind stats.

6. **Espruino Code Generation & Export**:
   - Generates clean, production-ready Espruino JavaScript code.
   - 1-click **Copy to Clipboard**.
   - 1-click **Download `.app.js`**.
   - 1-click **Open in Espruino Web IDE** (`espruino.com/ide`).
   - **App Metadata Generator** (`metadata.json`, `app.info`) for the official BangleApps Store.

7. **Code Importer**:
   - Paste existing Bangle.js `new Layout({...})` JavaScript code or JSON to load and edit visually.

8. **Web Bluetooth Direct Upload**:
   - Uses the browser's Web Bluetooth API (Nordic UART Service `6e400001-b5a3-f393-e0a9-e50e24dcca9e`).
   - One-click upload directly into watch RAM via BLE REPL for instant testing on real hardware!

---

## 🚀 Quick Start

### Option 1: Zero-Dependency Python Server (Recommended)

Run the included launcher script:

```bash
./serve.py
# or
python3 serve.py
```

This will automatically start a local server on port `8080` and open `http://localhost:8080/ui-designer/index.html` in your default web browser.

### Option 2: Open Directly in Browser

Simply open `ui-designer/index.html` directly in Google Chrome, Microsoft Edge, or Chromium:

```bash
xdg-open ui-designer/index.html
```

*(Note: Web Bluetooth requires an HTTPS or localhost origin, so use `./serve.py` when testing live Web Bluetooth uploading).*

---

## 🧪 Automated Testing

A unit test suite verifying the layout engine, sizing calculations, icon encoding, code generation, and code importing is included:

```bash
gjs ui-designer/test/test-engine.js
```

---

## 📂 Project Structure

```text
banglejs2-tools/
├── README.md                      # Project documentation and quick start guide
├── index.html                     # Root redirect to UI Studio
├── serve.py                       # Zero-dependency local server and launcher
├── Layout.js                      # Official Espruino Layout.js reference
├── ui-designer/                   # Bangle.js 2 UI Studio application
│   ├── index.html                 # Main single-page web app
│   ├── css/
│   │   └── app.css                # Polished dark theme, watch casing, and styling
│   ├── js/
│   │   ├── app.js                 # Studio controller, UI bindings, and state
│   │   ├── layout-engine.js       # Espruino Layout.js simulation engine
│   │   ├── bangle-display.js      # 176×176 Canvas renderer, 3-bit LCD & widgets
│   │   ├── menu-engine.js         # E.showMenu interactive simulator
│   │   ├── icons.js               # Smartwatch icon library & bitmap encoder
│   │   ├── templates.js           # Pre-built watchfaces, dashboards, and prompts
│   │   ├── code-generator.js      # Clean Espruino JS code & metadata generator
│   │   ├── code-importer.js       # Layout.js code parser and importer
│   │   └── web-bluetooth.js       # Web Bluetooth Nordic UART live uploader
│   └── test/
│       └── test-engine.js         # Automated test suite (executable with gjs)
└── context/BangleJS2/             # Consolidated offline Bangle.js 2 documentation
    ├── docs/                      # Official API references, tutorials, and specs
    └── scrape_banglejs2_docs.py   # Documentation scraper script
```

---

## 📚 Documentation & References

Comprehensive offline documentation for Bangle.js 2 is available in the [`context/BangleJS2/`](context/BangleJS2/) directory:
* [Bangle.js 2 Overview & Hardware Guide](context/BangleJS2/docs/banglejs2_overview.md)
* [Software API Reference (700+ methods)](context/BangleJS2/docs/banglejs2_api_reference.md)
* [Layout Library Guide](context/BangleJS2/docs/tutorials/layout_library.md)
* [Watch Faces Tutorial](context/BangleJS2/docs/tutorials/clock_faces.md)
* [Widgets Guide](context/BangleJS2/docs/tutorials/widgets.md)
* [TypeScript Type Definitions](context/BangleJS2/docs/types/)

