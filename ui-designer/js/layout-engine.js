/**
 * Bangle.js 2 Layout Simulation Engine
 * Faithfully mirrors Espruino's official Layout.js calculation and rendering algorithms.
 */

class BangleLayoutEngine {
  constructor(layoutObject, options = {}, appRect = { x: 0, y: 0, w: 176, h: 176 }) {
    this.originalLayout = JSON.parse(JSON.stringify(layoutObject));
    this.options = options;
    this.appRect = { ...appRect };
    this.theme = {
      fg: "#ffffff",
      bg: "#000000",
      fg2: "#00ffff",
      bg2: "#182030",
      fgH: "#000000",
      bgH: "#00ffff",
      dark: true
    };
    this.nodesById = {};
    this.computedTree = null;
    this.prepare();
  }

  setTheme(isDark = true) {
    if (isDark) {
      this.theme = {
        fg: "#ffffff",
        bg: "#000000",
        fg2: "#00ffff",
        bg2: "#141e28",
        fgH: "#000000",
        bgH: "#00ffff",
        dark: true
      };
    } else {
      this.theme = {
        fg: "#000000",
        bg: "#ffffff",
        fg2: "#0000ff",
        bg2: "#e0e8f0",
        fgH: "#ffffff",
        bgH: "#0000ff",
        dark: false
      };
    }
  }

  setAppRect(rect) {
    this.appRect = { ...rect };
    this.update();
  }

  /**
   * Prepares the layout tree, adding IDs, wrapping options.btns if present
   */
  prepare() {
    this.computedTree = JSON.parse(JSON.stringify(this.originalLayout));
    this.nodesById = {};

    // Handle soft buttons on Bangle.js 2 (HWVERSION 2)
    if (this.options && this.options.btns && this.options.btns.length > 0) {
      const buttons = this.options.btns.map(b => ({
        type: "btn",
        label: b.label || "",
        cb: b.cb,
        cbl: b.cbl,
        filly: 1,
        width: 34,
        r: 1
      }));

      this.computedTree.width = (this.computedTree.width || this.appRect.w) - 34;
      this.computedTree = {
        type: "h",
        filly: 1,
        fillx: 1,
        c: [
          this.computedTree,
          {
            type: "v",
            c: buttons
          }
        ]
      };
    }

    const indexNodes = (node, path = "0") => {
      node._path = path;
      if (node.id) {
        this.nodesById[node.id] = node;
      }
      if (!node.type) node.type = "";
      if (node.c && Array.isArray(node.c)) {
        node.c.forEach((child, idx) => indexNodes(child, `${path}.${idx}`));
      }
    };

    indexNodes(this.computedTree);
    this.update();
  }

  /**
   * Font parsing helper
   */
  parseFont(fontStr) {
    if (!fontStr) fontStr = "6x8:2";
    if (typeof fontStr === "string" && fontStr.endsWith("%")) {
      const pct = parseFloat(fontStr.slice(0, -1));
      const px = Math.max(8, Math.round((this.appRect.h * pct) / 100));
      return { type: "vector", size: px, family: "Vector" };
    }

    if (fontStr.startsWith("Vector:") || fontStr.startsWith("Vector")) {
      const parts = fontStr.split(":");
      const size = parts[1] ? parseInt(parts[1], 10) : 14;
      return { type: "vector", size: size || 14, family: "Vector" };
    }

    if (fontStr.startsWith("6x8")) {
      const parts = fontStr.split(":");
      const scale = parts[1] ? parseInt(parts[1], 10) : 1;
      return { type: "bitmap", width: 6 * scale, height: 8 * scale, scale: scale, family: "6x8" };
    }

    if (fontStr.startsWith("12x20")) {
      const parts = fontStr.split(":");
      const scale = parts[1] ? parseInt(parts[1], 10) : 1;
      return { type: "bitmap", width: 12 * scale, height: 20 * scale, scale: scale, family: "12x20" };
    }

    if (fontStr.startsWith("4x6")) {
      const parts = fontStr.split(":");
      const scale = parts[1] ? parseInt(parts[1], 10) : 1;
      return { type: "bitmap", width: 4 * scale, height: 6 * scale, scale: scale, family: "4x6" };
    }

    return { type: "vector", size: 14, family: "Vector" };
  }

  /**
   * Measure text width and height
   */
  measureText(label, fontStr) {
    if (!label) return { width: 0, height: 0 };
    const font = this.parseFont(fontStr);

    if (font.type === "bitmap") {
      const lines = String(label).split("\n");
      const maxLen = Math.max(...lines.map(l => l.length));
      return {
        width: maxLen * font.width,
        height: lines.length * font.height
      };
    }

    // Vector font approximation for Espruino Vector font
    const lines = String(label).split("\n");
    const maxLen = Math.max(...lines.map(l => l.length));
    const charWidth = font.size * 0.62;
    return {
      width: Math.ceil(maxLen * charWidth),
      height: Math.ceil(lines.length * font.size)
    };
  }

  /**
   * Word wrap lines
   */
  wrapString(text, maxWidth, fontStr) {
    if (!text || maxWidth <= 0) return [text || ""];
    const words = String(text).split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.measureText(testLine, fontStr);
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [""];
  }

  /**
   * Measure images or icon metrics
   */
  measureImage(src, scale = 1) {
    let w = 16;
    let h = 16;
    if (typeof src === "string" && BangleIcons.get(src)) {
      const icon = BangleIcons.get(src);
      w = icon.width;
      h = icon.height;
    }
    return {
      width: Math.ceil(w * (scale || 1)),
      height: Math.ceil(h * (scale || 1))
    };
  }

  /**
   * Exact layout computation mirroring Layout.prototype.update
   */
  update() {
    const max = Math.max;
    const floor = Math.floor;
    const root = this.computedTree;
    if (!root) return;

    // Pass 1: Compute minimum dimensions (_w, _h) bottom-up
    const updateMin = (l) => {
      l.pad = l.pad || 0;
      l.scale = l.scale || 1;

      switch (l.type) {
        case "txt": {
          if (l.wrap) {
            l._w = 0;
            l._h = 0;
          } else {
            const m = this.measureText(l.label, l.font);
            l._w = m.width;
            l._h = m.height;
          }
          break;
        }
        case "btn": {
          let m;
          if (l.src) {
            m = this.measureImage(l.src, l.scale);
          } else {
            m = this.measureText(l.label || "", l.font || "6x8:2");
          }
          l._h = 16 + Math.ceil(m.height * l.scale);
          l._w = 20 + Math.ceil(m.width * l.scale);
          break;
        }
        case "img": {
          const m = this.measureImage(l.src, l.scale);
          l._w = m.width;
          l._h = m.height;
          break;
        }
        case "h": {
          if (l.c && l.c.length > 0) {
            l.c.forEach(updateMin);
            l._h = l.c.reduce((acc, c) => max(acc, c._h), 0);
            l.__w = l._w = l.c.reduce((acc, c) => acc + c._w, 0);
            if (l.fillx == null && l.c.some(c => c.fillx)) l.fillx = 1;
            if (l.filly == null && l.c.some(c => c.filly)) l.filly = 1;
          } else {
            l._w = 0;
            l._h = 0;
            l.__w = 0;
          }
          break;
        }
        case "v": {
          if (l.c && l.c.length > 0) {
            l.c.forEach(updateMin);
            l.__h = l._h = l.c.reduce((acc, c) => acc + c._h, 0);
            l._w = l.c.reduce((acc, c) => max(acc, c._w), 0);
            if (l.fillx == null && l.c.some(c => c.fillx)) l.fillx = 1;
            if (l.filly == null && l.c.some(c => c.filly)) l.filly = 1;
          } else {
            l._w = 0;
            l._h = 0;
            l.__h = 0;
          }
          break;
        }
        case "custom":
        case "":
        default: {
          l._w = 0;
          l._h = 0;
          break;
        }
      }

      // Handle 90/270 deg rotation swap
      if (l.r && (l.r & 1)) {
        const temp = l._w;
        l._w = l._h;
        l._h = temp;
      }

      // Explicit width/height override and padding
      l._w = max(l._w + (l.pad << 1), 0 | (l.width || 0));
      l._h = max(l._h + (l.pad << 1), 0 | (l.height || 0));
    };

    updateMin(root);

    // Pass 2: Set root dimensions
    if (root.fillx || root.filly) {
      root.w = this.appRect.w;
      root.h = this.appRect.h;
      root.x = this.appRect.x;
      root.y = this.appRect.y;
    } else {
      root.w = root._w;
      root.h = root._h;
      root.x = this.appRect.x + ((this.appRect.w - root.w) >> 1);
      root.y = this.appRect.y + ((this.appRect.h - root.h) >> 1);
    }

    // Pass 3: Distribute space top-down using fillx / filly and align
    const distribute = (l) => {
      if (l.type === "h" && l.c && l.c.length > 0) {
        let acc_w = l.x + (0 | l.pad);
        let accfillx = 0;
        let fillx = l.c.reduce((a, c) => a + (0 | (c.fillx || 0)), 0);

        if (!fillx) {
          acc_w += (l.w - (l.pad << 1) - (l.__w || l._w)) >> 1;
          fillx = 1;
        }

        let x = acc_w;
        l.c.forEach(c => {
          c.x = 0 | x;
          acc_w += c._w;
          accfillx += 0 | (c.fillx || 0);
          x = acc_w + floor((accfillx * (l.w - l._w)) / fillx);
          c.w = 0 | (x - c.x);
          c.h = 0 | (c.filly ? l.h - (l.pad << 1) : c._h);
          c.y = 0 | (l.y + (0 | l.pad) + (((1 + (0 | (c.valign || 0))) * (l.h - (l.pad << 1) - c.h)) >> 1));
          if (c.c) distribute(c);
        });
      } else if (l.type === "v" && l.c && l.c.length > 0) {
        let acc_h = l.y + (0 | l.pad);
        let accfilly = 0;
        let filly = l.c.reduce((a, c) => a + (0 | (c.filly || 0)), 0);

        if (!filly) {
          acc_h += (l.h - (l.pad << 1) - (l.__h || l._h)) >> 1;
          filly = 1;
        }

        let y = acc_h;
        l.c.forEach(c => {
          c.y = 0 | y;
          acc_h += c._h;
          accfilly += 0 | (c.filly || 0);
          y = acc_h + floor((accfilly * (l.h - l._h)) / filly);
          c.h = 0 | (y - c.y);
          c.w = 0 | (c.fillx ? l.w - (l.pad << 1) : c._w);
          c.x = 0 | (l.x + (0 | l.pad) + (((1 + (0 | (c.halign || 0))) * (l.w - (l.pad << 1) - c.w)) >> 1));
          if (c.c) distribute(c);
        });
      }
    };

    distribute(root);
  }

  /**
   * Find node at (x, y) coordinates
   */
  findNodeAt(x, y, node = this.computedTree) {
    if (!node) return null;
    if (x < node.x || y < node.y || x >= node.x + node.w || y >= node.y + node.h) {
      return null;
    }

    if (node.c && node.c.length > 0) {
      for (const child of node.c) {
        const hit = this.findNodeAt(x, y, child);
        if (hit) return hit;
      }
    }
    return node;
  }

  /**
   * Find node by its unique path identifier
   */
  findNodeByPath(path, node = this.computedTree) {
    if (!node) return null;
    if (node._path === path) return node;
    if (node.c) {
      for (const child of node.c) {
        const found = this.findNodeByPath(path, child);
        if (found) return found;
      }
    }
    return null;
  }
}

if (typeof globalThis !== "undefined") {
  globalThis.BangleLayoutEngine = BangleLayoutEngine;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleLayoutEngine;
}
