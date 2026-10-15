/**
 * Bangle.js 2 Display Canvas Simulator
 * Renders the 176x176 LCD display with pixel-perfection, 3-bit LCD colors,
 * widget bars, debug bounding boxes, and drag-and-drop element repositioning.
 */

class BangleDisplay {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.width = 176;
    this.height = 176;

    this.showWidgets = true;
    this.showDebugBounds = false;
    this.is3BitColorMode = false;
    this.showPixelGrid = false;
    this.backlightOn = true;
    this.selectedPath = null;
    this.activePressedNode = null;

    // Drag-and-drop state
    this.dragCandidate = null;
    this.dragState = null;
    this.wasDragging = false;

    this.engine = null;
    this.onNodeClick = options.onNodeClick || null;
    this.onNodeDrop = options.onNodeDrop || null;
    this.onInteractionLog = options.onInteractionLog || null;

    this.setupEvents();
  }

  getAppRect() {
    return this.showWidgets
      ? { x: 0, y: 24, w: 176, h: 152 }
      : { x: 0, y: 0, w: 176, h: 176 };
  }

  setEngine(engine) {
    this.engine = engine;
    this.engine.setAppRect(this.getAppRect());
    this.render();
  }

  setSelectedPath(path) {
    this.selectedPath = path;
    this.render();
  }

  toggleWidgets(enabled) {
    this.showWidgets = enabled;
    if (this.engine) {
      this.engine.setAppRect(this.getAppRect());
    }
    this.render();
  }

  toggleDebugBounds(enabled) {
    this.showDebugBounds = enabled;
    this.render();
  }

  toggle3BitColors(enabled) {
    this.is3BitColorMode = enabled;
    this.render();
  }

  togglePixelGrid(enabled) {
    this.showPixelGrid = enabled;
    this.render();
  }

  /**
   * Determine drop container and target insertion index based on cursor position
   */
  calculateDropTarget(draggedNode, x, y) {
    if (!this.engine || !this.engine.computedTree) return null;

    const candidateContainers = [];
    const collectContainers = (node) => {
      if (!node) return;
      // Do not allow dropping into self or descendants
      if (node._path === draggedNode._path || node._path.startsWith(draggedNode._path + ".")) {
        return;
      }
      if (node.type === "h" || node.type === "v" || node._path === "0") {
        candidateContainers.push(node);
      }
      if (node.c && Array.isArray(node.c)) {
        node.c.forEach(collectContainers);
      }
    };
    collectContainers(this.engine.computedTree);

    // Find the most specific (deepest) container bounding (x, y)
    let bestContainer = null;
    let maxDepth = -1;

    for (const c of candidateContainers) {
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        const depth = c._path.split(".").length;
        if (depth > maxDepth) {
          maxDepth = depth;
          bestContainer = c;
        }
      }
    }

    if (!bestContainer) {
      bestContainer = this.engine.computedTree;
    }

    const isVertical = bestContainer.type !== "h";
    const siblings = (bestContainer.c || []).filter(ch => ch._path !== draggedNode._path);
    let targetIndex = 0;
    let line = { x1: 0, y1: 0, x2: 0, y2: 0 };
    let suggestedAlign = null;

    if (siblings.length === 0) {
      targetIndex = 0;
      if (isVertical) {
        const midY = bestContainer.y + Math.max(12, Math.floor(bestContainer.h / 2));
        line = {
          x1: bestContainer.x + 4,
          y1: midY,
          x2: bestContainer.x + bestContainer.w - 4,
          y2: midY
        };
      } else {
        const midX = bestContainer.x + Math.max(12, Math.floor(bestContainer.w / 2));
        line = {
          x1: midX,
          y1: bestContainer.y + 4,
          x2: midX,
          y2: bestContainer.y + bestContainer.h - 4
        };
      }
    } else {
      if (isVertical) {
        targetIndex = siblings.length;
        let lineY = siblings[siblings.length - 1].y + siblings[siblings.length - 1].h;

        for (let i = 0; i < siblings.length; i++) {
          const midY = siblings[i].y + siblings[i].h / 2;
          if (y < midY) {
            targetIndex = i;
            lineY = siblings[i].y;
            break;
          }
        }

        line = {
          x1: bestContainer.x + 4,
          y1: lineY,
          x2: bestContainer.x + bestContainer.w - 4,
          y2: lineY
        };

        // Alignment suggestion based on horizontal position in column
        const third = bestContainer.w / 3;
        if (x < bestContainer.x + third) {
          suggestedAlign = { halign: -1 };
        } else if (x > bestContainer.x + 2 * third) {
          suggestedAlign = { halign: 1 };
        } else {
          suggestedAlign = { halign: 0 };
        }
      } else {
        targetIndex = siblings.length;
        let lineX = siblings[siblings.length - 1].x + siblings[siblings.length - 1].w;

        for (let i = 0; i < siblings.length; i++) {
          const midX = siblings[i].x + siblings[i].w / 2;
          if (x < midX) {
            targetIndex = i;
            lineX = siblings[i].x;
            break;
          }
        }

        line = {
          x1: lineX,
          y1: bestContainer.y + 4,
          x2: lineX,
          y2: bestContainer.y + bestContainer.h - 4
        };

        // Alignment suggestion based on vertical position in row
        const third = bestContainer.h / 3;
        if (y < bestContainer.y + third) {
          suggestedAlign = { valign: -1 };
        } else if (y > bestContainer.y + 2 * third) {
          suggestedAlign = { valign: 1 };
        } else {
          suggestedAlign = { valign: 0 };
        }
      }
    }

    return {
      parentPath: bestContainer._path,
      targetIndex: targetIndex,
      isVertical: isVertical,
      line: line,
      containerBox: {
        x: bestContainer.x,
        y: bestContainer.y,
        w: bestContainer.w,
        h: bestContainer.h
      },
      suggestedAlign: suggestedAlign
    };
  }

  setupEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      return {
        x: Math.floor((e.clientX - rect.x) * scaleX),
        y: Math.floor((e.clientY - rect.y) * scaleY)
      };
    };

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Only left click
      const pos = getPos(e);
      if (!this.engine) return;

      const node = this.engine.findNodeAt(pos.x, pos.y);
      if (node) {
        if (node.type === "btn" || node.cb) {
          this.activePressedNode = node;
          node.selected = true;
          this.render();
        }

        // Store candidate for drag if not root
        if (node._path !== "0") {
          this.dragCandidate = {
            node: node,
            path: node._path,
            startX: pos.x,
            startY: pos.y
          };
          this.wasDragging = false;
        }
      }
    });

    window.addEventListener("mousemove", (e) => {
      const pos = getPos(e);

      // Handle dragging
      if (this.dragCandidate) {
        const dist = Math.hypot(pos.x - this.dragCandidate.startX, pos.y - this.dragCandidate.startY);
        if (!this.dragState && dist > 3) {
          this.wasDragging = true;
          this.dragState = {
            node: this.dragCandidate.node,
            path: this.dragCandidate.path,
            isDragging: true,
            currentX: pos.x,
            currentY: pos.y,
            dropTarget: null
          };
          this.canvas.style.cursor = "grabbing";
        }

        if (this.dragState) {
          this.dragState.currentX = pos.x;
          this.dragState.currentY = pos.y;
          this.dragState.dropTarget = this.calculateDropTarget(this.dragState.node, pos.x, pos.y);
          this.render();
          return;
        }
      }

      // Cursor hover hint
      if (!this.dragCandidate && this.engine) {
        const hoverNode = this.engine.findNodeAt(pos.x, pos.y);
        if (hoverNode && hoverNode._path !== "0") {
          this.canvas.style.cursor = "grab";
        } else {
          this.canvas.style.cursor = "crosshair";
        }
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (this.activePressedNode) {
        delete this.activePressedNode.selected;
        this.activePressedNode = null;
        this.render();
      }

      if (this.dragState && this.dragState.isDragging) {
        const dt = this.dragState.dropTarget;
        const sourcePath = this.dragState.path;
        this.dragState = null;
        this.dragCandidate = null;
        this.canvas.style.cursor = "crosshair";
        this.render();

        if (dt && this.onNodeDrop) {
          this.onNodeDrop(sourcePath, dt.parentPath, dt.targetIndex, dt.suggestedAlign);
        }
        return;
      }

      this.dragCandidate = null;
      this.canvas.style.cursor = "crosshair";
    });

    this.canvas.addEventListener("click", (e) => {
      // If we just finished dragging, suppress click selection/execution
      if (this.wasDragging) {
        this.wasDragging = false;
        return;
      }

      const pos = getPos(e);
      if (!this.engine) return;
      const node = this.engine.findNodeAt(pos.x, pos.y);

      if (node) {
        if (this.onNodeClick) {
          this.onNodeClick(node);
        }

        // Trigger button or node callback simulation
        if (node.cb) {
          if (this.onInteractionLog) {
            this.onInteractionLog(`Tap on '${node.id || node.label || node.type}' -> Triggered callback!`);
          }
          if (typeof node.cb === "function") {
            try {
              node.cb(node);
            } catch (err) {
              console.error("Callback error:", err);
            }
          }
        }
      }
    });
  }

  /**
   * Quantize color to authentic Bangle.js 2 3-bit Memory LCD color (8 colors)
   */
  to3BitColor(colorStr) {
    if (!this.is3BitColorMode || !colorStr) return colorStr;
    const d = document.createElement("div");
    d.style.color = colorStr;
    document.body.appendChild(d);
    const rgb = window.getComputedStyle(d).color.match(/\d+/g);
    document.body.removeChild(d);
    if (!rgb || rgb.length < 3) return colorStr;

    const r = parseInt(rgb[0], 10) > 127 ? 255 : 0;
    const g = parseInt(rgb[1], 10) > 127 ? 255 : 0;
    const b = parseInt(rgb[2], 10) > 127 ? 255 : 0;
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Main render method
   */
  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Background fill
    const themeBg = this.engine ? this.engine.theme.bg : "#000000";
    ctx.fillStyle = this.to3BitColor(themeBg);
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Top Widgets Bar if enabled
    if (this.showWidgets) {
      this.drawWidgetsBar();
    }

    // Render Layout hierarchy
    if (this.engine && this.engine.computedTree) {
      this.renderNode(this.engine.computedTree);
    }

    // Draw Debug Bounding Boxes if enabled
    if (this.showDebugBounds && this.engine && this.engine.computedTree) {
      this.renderDebugBoxes(this.engine.computedTree, 1);
    }

    // Draw Selection Highlight (when not dragging)
    if (this.selectedPath && this.engine && (!this.dragState || !this.dragState.isDragging)) {
      const selectedNode = this.engine.findNodeByPath(this.selectedPath);
      if (selectedNode) {
        ctx.save();
        ctx.strokeStyle = "#ff9800";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(
          selectedNode.x + 0.5,
          selectedNode.y + 0.5,
          Math.max(1, selectedNode.w - 1),
          Math.max(1, selectedNode.h - 1)
        );
        ctx.restore();
      }
    }

    // Draw Live Dragging Visual Feedback
    if (this.dragState && this.dragState.isDragging) {
      const dt = this.dragState.dropTarget;
      if (dt) {
        // 1. Highlight target container with glowing dashed border
        ctx.save();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          dt.containerBox.x + 0.5,
          dt.containerBox.y + 0.5,
          Math.max(1, dt.containerBox.w - 1),
          Math.max(1, dt.containerBox.h - 1)
        );
        ctx.restore();

        // 2. Draw insertion indicator line with circular endpoints
        ctx.save();
        ctx.strokeStyle = "#3fb950";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dt.line.x1, dt.line.y1);
        ctx.lineTo(dt.line.x2, dt.line.y2);
        ctx.stroke();

        ctx.fillStyle = "#3fb950";
        ctx.beginPath();
        ctx.arc(dt.line.x1, dt.line.y1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dt.line.x2, dt.line.y2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw floating preview ghost badge under cursor
      const node = this.dragState.node;
      const ghostW = Math.max(52, Math.min(100, (node.w || 50)));
      const ghostH = Math.max(22, Math.min(36, (node.h || 24)));
      const ghostX = Math.min(this.width - ghostW - 2, Math.max(2, this.dragState.currentX - ghostW / 2));
      const ghostY = Math.min(this.height - ghostH - 2, Math.max(2, this.dragState.currentY - ghostH / 2));

      ctx.save();
      ctx.fillStyle = "rgba(13, 17, 23, 0.92)";
      this.fillRoundRect(ctx, ghostX, ghostY, ghostW, ghostH, 4);

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      this.strokeRoundRect(ctx, ghostX + 0.5, ghostY + 0.5, ghostW - 1, ghostH - 1, 4);

      ctx.fillStyle = "#ffffff";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const displayLabel = node.id ? `#${node.id}` : (node.label || (node.type || "space").toUpperCase());
      ctx.fillText(displayLabel.length > 12 ? displayLabel.slice(0, 11) + "…" : displayLabel, ghostX + ghostW / 2, ghostY + ghostH / 2);
      ctx.restore();
    }

    // Draw Subtle Pixel Grid Overlay if enabled
    if (this.showPixelGrid) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let y = 0; y < this.height; y += 2) {
        ctx.fillRect(0, y, this.width, 1);
      }
      ctx.restore();
    }
  }

  /**
   * Render Top Status / Widgets Bar (y: 0..23)
   */
  drawWidgetsBar() {
    const ctx = this.ctx;
    ctx.fillStyle = this.to3BitColor("#121820");
    ctx.fillRect(0, 0, this.width, 24);

    ctx.strokeStyle = this.to3BitColor("#283446");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 23.5);
    ctx.lineTo(this.width, 23.5);
    ctx.stroke();

    // Lock icon / Widget left
    ctx.fillStyle = this.to3BitColor("#00ffff");
    ctx.fillRect(6, 9, 8, 8);
    ctx.fillStyle = this.to3BitColor("#121820");
    ctx.fillRect(8, 11, 4, 4);

    // Bluetooth icon
    BangleIcons.renderToCanvas(ctx, BangleIcons.get("bluetooth"), 22, 5, 1, this.to3BitColor("#0088ff"));

    // Title / Time centered in widget bar
    ctx.fillStyle = this.to3BitColor("#ffffff");
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    ctx.fillText(timeStr, 88, 12);

    // Battery icon on right
    BangleIcons.renderToCanvas(ctx, BangleIcons.get("battery"), 148, 7, 1, this.to3BitColor("#00ff00"));
  }

  /**
   * Render an individual layout node
   */
  renderNode(l) {
    if (!l) return;
    const ctx = this.ctx;
    const theme = this.engine.theme;

    // If this node is being dragged, dim it slightly
    const isBeingDragged = this.dragState && this.dragState.isDragging && this.dragState.path === l._path;
    if (isBeingDragged) {
      ctx.save();
      ctx.globalAlpha = 0.35;
    }

    // Node background color
    if (l.bgCol !== undefined) {
      ctx.fillStyle = this.to3BitColor(l.bgCol);
      ctx.fillRect(l.x, l.y, l.w, l.h);
    }

    const fgColor = l.col !== undefined ? l.col : theme.fg;

    switch (l.type) {
      case "txt": {
        ctx.save();
        ctx.fillStyle = this.to3BitColor(fgColor);
        const font = this.engine.parseFont(l.font);

        if (font.type === "bitmap") {
          ctx.font = `${font.height}px monospace`;
        } else {
          ctx.font = `${font.size}px "SF Pro", "Segoe UI", sans-serif`;
        }

        if (l.wrap) {
          const lines = this.engine.wrapString(l.label, l.w, l.font);
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const lineHeight = font.type === "bitmap" ? font.height : font.size;
          const totalHeight = lines.length * lineHeight;
          let yStart = l.y + Math.floor((l.h - totalHeight) / 2);
          lines.forEach((line) => {
            ctx.fillText(line, l.x + Math.floor(l.w / 2), yStart);
            yStart += lineHeight;
          });
        } else {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(l.label || "", l.x + Math.floor(l.w / 2), l.y + Math.floor(l.h / 2));
        }
        ctx.restore();
        break;
      }

      case "btn": {
        const pad = l.pad || 0;
        const x = l.x + pad;
        const y = l.y + pad;
        const w = l.w - pad * 2;
        const h = l.h - pad * 2;

        let btnface = l.btnFaceCol !== undefined ? l.btnFaceCol : theme.bg2;
        let btnborder = l.btnBorderCol !== undefined ? l.btnBorderCol : theme.fg2;

        if (l.selected) {
          btnface = theme.bgH;
          btnborder = theme.fgH;
        }

        // Draw button face
        ctx.fillStyle = this.to3BitColor(btnface);
        this.fillRoundRect(ctx, x, y, w, h, 6);

        // Draw button border
        ctx.strokeStyle = this.to3BitColor(btnborder);
        ctx.lineWidth = 1;
        this.strokeRoundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 6);

        // Draw button content
        if (l.src) {
          const icon = BangleIcons.get(l.src);
          if (icon) {
            const iconW = icon.width * (l.scale || 1);
            const iconH = icon.height * (l.scale || 1);
            const iconX = x + Math.floor((w - iconW) / 2);
            const iconY = y + Math.floor((h - iconH) / 2);
            BangleIcons.renderToCanvas(ctx, icon, iconX, iconY, l.scale || 1, this.to3BitColor(fgColor));
          }
        } else {
          ctx.save();
          ctx.fillStyle = this.to3BitColor(l.selected ? theme.fgH : fgColor);
          const font = this.engine.parseFont(l.font || "6x8:2");
          if (font.type === "bitmap") {
            ctx.font = `${font.height}px monospace`;
          } else {
            ctx.font = `${font.size}px "SF Pro", "Segoe UI", sans-serif`;
          }
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(l.label || "", x + Math.floor(w / 2), y + Math.floor(h / 2));
          ctx.restore();
        }
        break;
      }

      case "img": {
        const icon = BangleIcons.get(l.src);
        if (icon) {
          const iconW = icon.width * (l.scale || 1);
          const iconH = icon.height * (l.scale || 1);
          const iconX = l.x + Math.floor((l.w - iconW) / 2);
          const iconY = l.y + Math.floor((l.h - iconH) / 2);
          BangleIcons.renderToCanvas(ctx, icon, iconX, iconY, l.scale || 1, this.to3BitColor(fgColor));
        } else {
          ctx.fillStyle = this.to3BitColor(fgColor);
          ctx.fillRect(l.x + 2, l.y + 2, l.w - 4, l.h - 4);
        }
        break;
      }

      case "custom": {
        if (typeof l.render === "function") {
          try {
            l.render(l, ctx, this);
          } catch (err) {
            console.error("Custom render error:", err);
          }
        } else {
          this.drawCustomPlaceholder(l);
        }
        break;
      }

      case "h":
      case "v": {
        if (l.c && Array.isArray(l.c)) {
          l.c.forEach((child) => this.renderNode(child));
        }
        break;
      }

      case "":
      default:
        break;
    }

    if (isBeingDragged) {
      ctx.restore();
    }
  }

  /**
   * Placeholder graphic for custom components
   */
  drawCustomPlaceholder(l) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = this.to3BitColor("#00ffaa");
    ctx.lineWidth = 1;
    ctx.strokeRect(l.x + 2, l.y + 2, l.w - 4, l.h - 4);

    ctx.fillStyle = this.to3BitColor("#00ffaa");
    const bars = 8;
    const barW = Math.max(2, Math.floor((l.w - 12) / bars));
    for (let i = 0; i < bars; i++) {
      const bh = Math.floor(Math.sin((i / bars) * Math.PI) * (l.h - 10));
      ctx.fillRect(l.x + 6 + i * (barW + 1), l.y + l.h - 4 - bh, barW, bh);
    }
    ctx.restore();
  }

  /**
   * Mirrors Layout.prototype.debug() with color-coded bounding boxes
   */
  renderDebugBoxes(l, c = 1) {
    if (!l) return;
    const ctx = this.ctx;
    const colors = ["#ff0055", "#00ffff", "#ffff00", "#00ff00", "#ff00ff", "#ff8800"];
    const color = colors[(c - 1) % colors.length];

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(l.x + c - 1, l.y + c - 1, Math.max(1, l.w - c * 2 + 1), Math.max(1, l.h - c * 2 + 1));

    if (l.pad) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.strokeRect(
        l.x + l.pad - 1,
        l.y + l.pad - 1,
        Math.max(1, l.w - l.pad * 2 + 1),
        Math.max(1, l.h - l.pad * 2 + 1)
      );
    }
    ctx.restore();

    if (l.c && Array.isArray(l.c)) {
      l.c.forEach((child) => this.renderDebugBoxes(child, c + 1));
    }
  }

  fillRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  strokeRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.stroke();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleDisplay;
}
