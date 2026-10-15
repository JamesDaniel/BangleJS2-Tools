/**
 * Bangle.js 2 UI Designer - Main Application Controller
 */

class BangleAppStudio {
  constructor() {
    this.mode = "layout"; // "layout" or "menu"
    this.currentZoom = 2; // 2x default (352x352)
    this.selectedPath = "0";

    // Initialize Layout with Digital Watchface template
    this.currentLayout = JSON.parse(JSON.stringify(BangleTemplates[0].layout));
    this.currentOptions = { lazy: false, btns: [] };
    this.appMetadata = {
      name: "Bangle Watch Face",
      id: "mywatch",
      version: "0.01",
      description: "Custom Bangle.js 2 Watch Face"
    };

    // Canvas & Display
    this.canvas = document.getElementById("bangleCanvas");
    this.display = new BangleDisplay(this.canvas, {
      onNodeClick: (node) => this.selectNode(node._path),
      onNodeDrop: (sourcePath, targetParentPath, targetIndex, suggestedAlign) => {
        this.moveNode(sourcePath, targetParentPath, targetIndex, suggestedAlign);
      },
      onInteractionLog: (msg) => this.log(msg, "info")
    });

    // Menu Engine
    this.menuEngine = new BangleMenuEngine(null, this.display);

    // Bluetooth
    this.bluetooth = new BangleBluetooth({
      onStatusChange: (status, isConn) => this.updateBleStatus(status, isConn),
      onLog: (msg) => this.log(msg, "info")
    });

    // Initialize Engine & View
    this.layoutEngine = new BangleLayoutEngine(this.currentLayout, this.currentOptions, this.display.getAppRect());
    this.display.setEngine(this.layoutEngine);

    this.initUI();
    this.refreshAll();
  }

  log(msg, level = "info") {
    const consoleEl = document.getElementById("activityConsole");
    if (!consoleEl) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = `console-entry ${level}`;
    entry.textContent = `[${time}] ${msg}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  initUI() {
    // Mode switcher
    document.getElementById("btnModeLayout").addEventListener("click", () => this.switchMode("layout"));
    document.getElementById("btnModeMenu").addEventListener("click", () => this.switchMode("menu"));

    // Zoom buttons
    document.querySelectorAll(".zoom-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const zoom = parseInt(e.target.dataset.zoom, 10);
        this.setZoom(zoom);
      });
    });

    // Display toggles
    document.getElementById("chkWidgets").addEventListener("change", (e) => {
      this.display.toggleWidgets(e.target.checked);
      this.refreshCode();
    });

    document.getElementById("chkDebugBounds").addEventListener("change", (e) => {
      this.display.toggleDebugBounds(e.target.checked);
    });

    document.getElementById("chk3BitColor").addEventListener("change", (e) => {
      this.display.toggle3BitColors(e.target.checked);
    });

    document.getElementById("chkPixelGrid").addEventListener("change", (e) => {
      this.display.togglePixelGrid(e.target.checked);
    });

    document.getElementById("btnThemeToggle").addEventListener("click", () => {
      const isDark = !this.layoutEngine.theme.dark;
      this.layoutEngine.setTheme(isDark);
      this.display.render();
      this.log(`Switched to ${isDark ? "Dark" : "Light"} theme.`);
    });

    // Hardware button click
    document.getElementById("physicalWatchBtn").addEventListener("click", () => {
      this.log("Physical Button (BTN1) pressed!", "info");
      // If layout has a button callback or handles hardware button
      if (this.currentOptions.btns && this.currentOptions.btns.length === 1) {
        const b = this.currentOptions.btns[0];
        if (b.cb) b.cb();
      }
    });

    // Mouse coordinate tracking on screen
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 176 / rect.width;
      const scaleY = 176 / rect.height;
      const x = Math.min(175, Math.max(0, Math.floor((e.clientX - rect.x) * scaleX)));
      const y = Math.min(175, Math.max(0, Math.floor((e.clientY - rect.y) * scaleY)));
      document.getElementById("coordBadge").textContent = `X: ${x}  Y: ${y}`;
    });

    // Tab buttons
    document.querySelectorAll(".tab-btn").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
        e.target.classList.add("active");
        const tabId = e.target.dataset.tab;
        document.getElementById(tabId).classList.add("active");
      });
    });

    // Palette item buttons (Add component)
    document.querySelectorAll(".palette-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const type = btn.dataset.type;
        this.addComponent(type);
      });
    });

    // Property inputs
    this.setupPropertyBindings();

    // Code actions
    document.getElementById("btnCopyCode").addEventListener("click", () => this.copyCode());
    document.getElementById("btnDownloadJs").addEventListener("click", () => this.downloadCode());
    document.getElementById("btnOpenWebIde").addEventListener("click", () => this.openInWebIde());
    document.getElementById("btnRunBle").addEventListener("click", () => this.runOnWatchBle());

    // Import Modal
    document.getElementById("btnOpenImportModal").addEventListener("click", () => {
      document.getElementById("importModal").classList.add("active");
    });
    document.getElementById("btnCloseImportModal").addEventListener("click", () => {
      document.getElementById("importModal").classList.remove("active");
    });
    document.getElementById("btnDoImport").addEventListener("click", () => this.doImport());

    // Templates Modal
    document.getElementById("btnOpenTemplatesModal").addEventListener("click", () => {
      this.renderTemplatesList();
      document.getElementById("templatesModal").classList.add("active");
    });
    document.getElementById("btnCloseTemplatesModal").addEventListener("click", () => {
      document.getElementById("templatesModal").classList.remove("active");
    });

    // Color swatches in property inspector
    document.querySelectorAll(".swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        const color = e.target.dataset.color;
        const targetProp = e.target.dataset.target || "col";
        const input = document.getElementById(`prop_${targetProp}`);
        if (input) {
          input.value = color;
          input.dispatchEvent(new Event("input"));
        }
      });
    });

    // Position and arrangement controls
    const btnMoveUp = document.getElementById("btnMoveUp");
    if (btnMoveUp) btnMoveUp.addEventListener("click", () => this.moveNodeDirection(this.selectedPath, -1));
    const btnMoveDown = document.getElementById("btnMoveDown");
    if (btnMoveDown) btnMoveDown.addEventListener("click", () => this.moveNodeDirection(this.selectedPath, 1));
    const btnWrapRow = document.getElementById("btnWrapRow");
    if (btnWrapRow) btnWrapRow.addEventListener("click", () => this.wrapNode(this.selectedPath, "h"));
    const btnWrapCol = document.getElementById("btnWrapCol");
    if (btnWrapCol) btnWrapCol.addEventListener("click", () => this.wrapNode(this.selectedPath, "v"));

    this.setZoom(2);
  }

  setZoom(zoom) {
    this.currentZoom = zoom;
    const px = 176 * zoom;
    this.canvas.style.width = `${px}px`;
    this.canvas.style.height = `${px}px`;
    document.querySelectorAll(".zoom-btn").forEach((btn) => {
      btn.classList.toggle("btn-primary", parseInt(btn.dataset.zoom, 10) === zoom);
      btn.classList.toggle("btn-secondary", parseInt(btn.dataset.zoom, 10) !== zoom);
    });
  }

  switchMode(newMode) {
    this.mode = newMode;
    document.getElementById("btnModeLayout").classList.toggle("btn-primary", newMode === "layout");
    document.getElementById("btnModeLayout").classList.toggle("btn-secondary", newMode !== "layout");
    document.getElementById("btnModeMenu").classList.toggle("btn-primary", newMode === "menu");
    document.getElementById("btnModeMenu").classList.toggle("btn-secondary", newMode !== "menu");

    if (newMode === "menu") {
      this.display.engine = {
        theme: { bg: "#000000", fg: "#ffffff" },
        findNodeAt: () => null,
        findNodeByPath: () => null,
        computedTree: null
      };
      this.display.render = () => {
        this.display.ctx.fillStyle = "#000";
        this.display.ctx.fillRect(0, 0, 176, 176);
        if (this.display.showWidgets) this.display.drawWidgetsBar();
        this.menuEngine.render(this.display.ctx);
      };
      this.display.render();
      document.getElementById("codeViewer").value = this.menuEngine.generateCode();
      this.log("Switched to Graphical Menu (E.showMenu) mode.", "info");
    } else {
      this.display.setEngine(this.layoutEngine);
      this.refreshAll();
      this.log("Switched to Layout.js designer mode.", "info");
    }
  }

  selectNode(path) {
    this.selectedPath = path;
    this.display.setSelectedPath(path);
    this.renderHierarchyTree();
    this.populatePropertyInspector();
  }

  setupPropertyBindings() {
    const bindInput = (id, prop, isNumber = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const node = this.layoutEngine.findNodeByPath(this.selectedPath);
        if (!node) return;
        const val = el.value.trim();
        if (val === "") {
          delete node[prop];
        } else {
          node[prop] = isNumber ? parseFloat(val) : val;
        }
        this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
        this.layoutEngine.prepare();
        this.display.render();
        this.refreshCode();
      });
    };

    bindInput("prop_id", "id");
    bindInput("prop_label", "label");
    bindInput("prop_font", "font");
    bindInput("prop_col", "col");
    bindInput("prop_bgCol", "bgCol");
    bindInput("prop_btnBorderCol", "btnBorderCol");
    bindInput("prop_btnFaceCol", "btnFaceCol");
    bindInput("prop_pad", "pad", true);
    bindInput("prop_fillx", "fillx", true);
    bindInput("prop_filly", "filly", true);
    bindInput("prop_width", "width", true);
    bindInput("prop_height", "height", true);
    bindInput("prop_scale", "scale", true);
    bindInput("prop_r", "r", true);

    const wrapEl = document.getElementById("prop_wrap");
    if (wrapEl) {
      wrapEl.addEventListener("change", (e) => {
        const node = this.layoutEngine.findNodeByPath(this.selectedPath);
        if (!node) return;
        node.wrap = e.target.checked;
        this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
        this.layoutEngine.prepare();
        this.display.render();
        this.refreshCode();
      });
    }

    const halignEl = document.getElementById("prop_halign");
    if (halignEl) {
      halignEl.addEventListener("change", (e) => {
        const node = this.layoutEngine.findNodeByPath(this.selectedPath);
        if (!node) return;
        node.halign = parseInt(e.target.value, 10);
        this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
        this.layoutEngine.prepare();
        this.display.render();
        this.refreshCode();
      });
    }

    const valignEl = document.getElementById("prop_valign");
    if (valignEl) {
      valignEl.addEventListener("change", (e) => {
        const node = this.layoutEngine.findNodeByPath(this.selectedPath);
        if (!node) return;
        node.valign = parseInt(e.target.value, 10);
        this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
        this.layoutEngine.prepare();
        this.display.render();
        this.refreshCode();
      });
    }

    const iconSelect = document.getElementById("prop_src");
    if (iconSelect) {
      BangleIcons.library.forEach((icon) => {
        const opt = document.createElement("option");
        opt.value = icon.id;
        opt.textContent = `${icon.name} (${icon.category})`;
        iconSelect.appendChild(opt);
      });
      iconSelect.addEventListener("change", (e) => {
        const node = this.layoutEngine.findNodeByPath(this.selectedPath);
        if (!node) return;
        if (e.target.value) {
          node.src = e.target.value;
        } else {
          delete node.src;
        }
        this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
        this.layoutEngine.prepare();
        this.display.render();
        this.refreshCode();
      });
    }
  }

  populatePropertyInspector() {
    const node = this.layoutEngine.findNodeByPath(this.selectedPath);
    const form = document.getElementById("propertyForm");
    const emptyNotice = document.getElementById("noSelectionNotice");

    if (!node) {
      form.style.display = "none";
      emptyNotice.style.display = "block";
      return;
    }

    form.style.display = "block";
    emptyNotice.style.display = "none";

    document.getElementById("inspectorNodeType").textContent = (node.type || "space").toUpperCase();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : "";
    };

    setVal("prop_id", node.id);
    setVal("prop_label", node.label);
    setVal("prop_font", node.font);
    setVal("prop_col", node.col);
    setVal("prop_bgCol", node.bgCol);
    setVal("prop_btnBorderCol", node.btnBorderCol);
    setVal("prop_btnFaceCol", node.btnFaceCol);
    setVal("prop_pad", node.pad);
    setVal("prop_fillx", node.fillx);
    setVal("prop_filly", node.filly);
    setVal("prop_width", node.width);
    setVal("prop_height", node.height);
    setVal("prop_scale", node.scale);
    setVal("prop_r", node.r || 0);

    const wrapEl = document.getElementById("prop_wrap");
    if (wrapEl) wrapEl.checked = !!node.wrap;

    const halignEl = document.getElementById("prop_halign");
    if (halignEl) halignEl.value = node.halign !== undefined ? node.halign : 0;

    const valignEl = document.getElementById("prop_valign");
    if (valignEl) valignEl.value = node.valign !== undefined ? node.valign : 0;

    const iconSelect = document.getElementById("prop_src");
    if (iconSelect) iconSelect.value = node.src || "";

    // Position buttons state
    const isRoot = this.selectedPath === "0";
    const parts = this.selectedPath.split(".");
    const index = parseInt(parts[parts.length - 1], 10);
    const parentNode = !isRoot ? this.layoutEngine.findNodeByPath(parts.slice(0, -1).join(".")) : null;
    const canMoveUp = !isRoot && index > 0;
    const canMoveDown = !isRoot && parentNode && parentNode.c && index < parentNode.c.length - 1;

    const btnMoveUp = document.getElementById("btnMoveUp");
    if (btnMoveUp) btnMoveUp.disabled = !canMoveUp;
    const btnMoveDown = document.getElementById("btnMoveDown");
    if (btnMoveDown) btnMoveDown.disabled = !canMoveDown;
  }

  moveNode(sourcePath, targetParentPath, targetIndex, suggestedAlign) {
    if (sourcePath === "0") {
      this.log("Cannot move root container.", "warn");
      return;
    }
    if (targetParentPath === sourcePath || targetParentPath.startsWith(sourcePath + ".")) {
      this.log("Cannot move element into itself.", "warn");
      return;
    }

    const sourceParts = sourcePath.split(".");
    const sourceIndex = parseInt(sourceParts.pop(), 10);
    const sourceParentPath = sourceParts.join(".");

    const sourceParent = this.layoutEngine.findNodeByPath(sourceParentPath);
    const targetParent = this.layoutEngine.findNodeByPath(targetParentPath);

    if (!sourceParent || !targetParent || !sourceParent.c) return;
    if (!targetParent.c) targetParent.c = [];

    // Remove from source container
    const [movedNode] = sourceParent.c.splice(sourceIndex, 1);
    if (!movedNode) return;

    // Apply alignment suggestions if provided and element doesn't fill that axis
    if (suggestedAlign) {
      if (suggestedAlign.halign !== undefined && !movedNode.fillx) {
        movedNode.halign = suggestedAlign.halign;
      }
      if (suggestedAlign.valign !== undefined && !movedNode.filly) {
        movedNode.valign = suggestedAlign.valign;
      }
    }

    // Adjust target index if moving within the same parent
    let insertIdx = targetIndex;
    if (sourceParentPath === targetParentPath && sourceIndex < targetIndex) {
      insertIdx = Math.max(0, insertIdx - 1);
    }
    insertIdx = Math.min(Math.max(0, insertIdx), targetParent.c.length);

    targetParent.c.splice(insertIdx, 0, movedNode);

    this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
    this.layoutEngine.prepare();
    this.selectNode(`${targetParentPath}.${insertIdx}`);
    this.refreshAll();

    const name = movedNode.id ? `#${movedNode.id}` : (movedNode.label || movedNode.type || "Element");
    this.log(`Moved ${name} into ${targetParent.type.toUpperCase()} container at index ${insertIdx}.`, "info");
  }

  moveNodeDirection(path, dir) {
    if (path === "0") return;
    const parts = path.split(".");
    const index = parseInt(parts.pop(), 10);
    const parentPath = parts.join(".");
    const parent = this.layoutEngine.findNodeByPath(parentPath);

    if (!parent || !parent.c) return;

    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= parent.c.length) return;

    const temp = parent.c[index];
    parent.c[index] = parent.c[targetIdx];
    parent.c[targetIdx] = temp;

    this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
    this.layoutEngine.prepare();
    this.selectNode(`${parentPath}.${targetIdx}`);
    this.refreshAll();
    this.log(`Moved element ${dir < 0 ? "up" : "down"}.`, "info");
  }

  wrapNode(path, containerType) {
    if (path === "0") {
      const oldRoot = this.layoutEngine.computedTree;
      const newRoot = {
        type: containerType,
        fillx: 1,
        filly: 1,
        c: [oldRoot]
      };
      this.layoutEngine.originalLayout = newRoot;
      this.layoutEngine.prepare();
      this.selectNode("0.0");
      this.refreshAll();
      this.log(`Wrapped layout in ${containerType.toUpperCase()} container.`, "info");
      return;
    }

    const parts = path.split(".");
    const index = parseInt(parts.pop(), 10);
    const parentPath = parts.join(".");
    const parent = this.layoutEngine.findNodeByPath(parentPath);

    if (!parent || !parent.c) return;

    const [child] = parent.c.splice(index, 1);
    const wrapper = {
      type: containerType,
      fillx: child.fillx || 1,
      filly: child.filly || 1,
      c: [child]
    };
    parent.c.splice(index, 0, wrapper);

    this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
    this.layoutEngine.prepare();
    this.selectNode(`${parentPath}.${index}.0`);
    this.refreshAll();
    this.log(`Wrapped element in ${containerType.toUpperCase()} container.`, "info");
  }

  addComponent(type) {
    const targetNode = this.layoutEngine.findNodeByPath(this.selectedPath);
    let container = targetNode;

    // If target is not a container, append to parent or root
    if (!container || (container.type !== "h" && container.type !== "v")) {
      container = this.layoutEngine.computedTree;
    }

    if (!container.c) container.c = [];

    let newComponent = { type: type };

    switch (type) {
      case "txt":
        newComponent = { type: "txt", font: "6x8:2", label: "New Text", col: "#ffffff" };
        break;
      case "btn":
        newComponent = { type: "btn", font: "6x8:2", label: "Button", col: "#00ffff", cb: "() => print('Clicked')" };
        break;
      case "img":
        newComponent = { type: "img", src: "heart", scale: 1 };
        break;
      case "h":
        newComponent = { type: "h", fillx: 1, c: [] };
        break;
      case "v":
        newComponent = { type: "v", filly: 1, c: [] };
        break;
      case "space":
        newComponent = { type: "", height: 8 };
        break;
      case "custom":
        newComponent = { type: "custom", height: 20, fillx: 1, id: "myGraph" };
        break;
    }

    container.c.push(newComponent);
    this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
    this.layoutEngine.prepare();
    this.refreshAll();
    this.log(`Added ${type.toUpperCase()} element.`, "info");
  }

  deleteNode(path) {
    if (path === "0") {
      this.log("Cannot delete the root container.", "warn");
      return;
    }

    const parts = path.split(".");
    const index = parseInt(parts.pop(), 10);
    const parentPath = parts.join(".");
    const parent = this.layoutEngine.findNodeByPath(parentPath);

    if (parent && parent.c) {
      parent.c.splice(index, 1);
      this.layoutEngine.originalLayout = JSON.parse(JSON.stringify(this.layoutEngine.computedTree));
      this.layoutEngine.prepare();
      this.selectNode(parentPath);
      this.refreshAll();
      this.log("Element deleted.", "info");
    }
  }

  renderHierarchyTree() {
    const treeEl = document.getElementById("hierarchyTree");
    treeEl.innerHTML = "";

    const buildTreeDOM = (node, depth = 0) => {
      const row = document.createElement("div");
      row.className = `tree-node ${node._path === this.selectedPath ? "selected" : ""}`;
      row.style.paddingLeft = `${depth * 14 + 8}px`;

      const isRoot = node._path === "0";
      const parts = node._path.split(".");
      const index = parseInt(parts[parts.length - 1], 10);
      const parentNode = !isRoot ? this.layoutEngine.findNodeByPath(parts.slice(0, -1).join(".")) : null;
      const canMoveUp = !isRoot && index > 0;
      const canMoveDown = !isRoot && parentNode && parentNode.c && index < parentNode.c.length - 1;

      const typeBadge = (node.type || "space").toUpperCase();
      const labelText = node.id ? `#${node.id}` : (node.label ? `"${node.label}"` : (node.src || ""));

      row.innerHTML = `
        <div class="tree-node-info">
          ${!isRoot ? `<span class="drag-grip" title="Drag to reorder">&#x22EE;</span>` : ""}
          <span class="tree-node-type">${typeBadge}</span>
          <span class="tree-node-id">${labelText}</span>
        </div>
        <div class="tree-actions">
          ${canMoveUp ? `<button class="tree-btn btn-up" title="Move Up">&#x25B2;</button>` : ""}
          ${canMoveDown ? `<button class="tree-btn btn-down" title="Move Down">&#x25BC;</button>` : ""}
          ${!isRoot ? `<button class="tree-btn btn-del" title="Delete">&#x2715;</button>` : ""}
        </div>
      `;

      // HTML5 Drag and drop in tree
      if (!isRoot) {
        row.draggable = true;
        row.addEventListener("dragstart", (e) => {
          e.stopPropagation();
          e.dataTransfer.setData("text/plain", node._path);
          e.dataTransfer.effectAllowed = "move";
          row.classList.add("dragging");
        });

        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
          document.querySelectorAll(".tree-node").forEach((n) => n.classList.remove("drag-over"));
        });
      }

      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        row.classList.add("drag-over");
      });

      row.addEventListener("dragleave", (e) => {
        e.stopPropagation();
        row.classList.remove("drag-over");
      });

      row.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        row.classList.remove("drag-over");
        const sourcePath = e.dataTransfer.getData("text/plain");
        if (!sourcePath || sourcePath === node._path) return;

        // If target is container, add inside; else add adjacent in parent
        if (node.type === "h" || node.type === "v" || node._path === "0") {
          this.moveNode(sourcePath, node._path, (node.c || []).length);
        } else {
          const pParts = node._path.split(".");
          const pIdx = parseInt(pParts.pop(), 10);
          const pParentPath = pParts.join(".");
          this.moveNode(sourcePath, pParentPath, pIdx + 1);
        }
      });

      row.addEventListener("click", (e) => {
        if (!e.target.closest(".tree-actions")) {
          this.selectNode(node._path);
        }
      });

      const upBtn = row.querySelector(".btn-up");
      if (upBtn) {
        upBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveNodeDirection(node._path, -1);
        });
      }

      const downBtn = row.querySelector(".btn-down");
      if (downBtn) {
        downBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveNodeDirection(node._path, 1);
        });
      }

      const delBtn = row.querySelector(".btn-del");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deleteNode(node._path);
        });
      }

      treeEl.appendChild(row);

      if (node.c && Array.isArray(node.c)) {
        node.c.forEach((child) => buildTreeDOM(child, depth + 1));
      }
    };

    if (this.layoutEngine.computedTree) {
      buildTreeDOM(this.layoutEngine.computedTree);
    }
  }

  renderTemplatesList() {
    const listEl = document.getElementById("templatesList");
    listEl.innerHTML = "";

    BangleTemplates.forEach((tpl) => {
      const card = document.createElement("div");
      card.className = "template-card";
      card.style.cssText = "background: var(--bg-panel-light); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: pointer; transition: all 0.15s ease;";
      card.innerHTML = `
        <div style="font-weight: 600; color: var(--text-bright); margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span>${tpl.name}</span>
          <span style="font-size: 10px; color: var(--accent-cyan); background: rgba(56,189,248,0.1); padding: 2px 6px; border-radius: 4px;">${tpl.category}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${tpl.description}</div>
      `;

      card.addEventListener("click", () => {
        this.currentLayout = JSON.parse(JSON.stringify(tpl.layout));
        this.layoutEngine = new BangleLayoutEngine(this.currentLayout, this.currentOptions, this.display.getAppRect());
        this.display.setEngine(this.layoutEngine);
        this.selectNode("0");
        this.refreshAll();
        document.getElementById("templatesModal").classList.remove("active");
        this.log(`Loaded template: ${tpl.name}`, "info");
      });

      listEl.appendChild(card);
    });
  }

  refreshCode() {
    if (this.mode === "menu") {
      document.getElementById("codeViewer").value = this.menuEngine.generateCode();
      return;
    }

    const code = BangleCodeGenerator.generateAppCode(
      this.layoutEngine.computedTree,
      {
        showWidgets: this.display.showWidgets,
        lazy: this.currentOptions.lazy,
        btns: this.currentOptions.btns
      },
      this.appMetadata
    );

    document.getElementById("codeViewer").value = code;
  }

  refreshAll() {
    this.renderHierarchyTree();
    this.populatePropertyInspector();
    this.display.render();
    this.refreshCode();
  }

  copyCode() {
    const code = document.getElementById("codeViewer").value;
    navigator.clipboard.writeText(code).then(() => {
      this.log("Copied JavaScript code to clipboard!", "info");
      const btn = document.getElementById("btnCopyCode");
      const oldText = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = oldText), 1500);
    });
  }

  downloadCode() {
    const code = document.getElementById("codeViewer").value;
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.appMetadata.id || "app"}.app.js`;
    a.click();
    URL.revokeObjectURL(url);
    this.log(`Downloaded ${a.download}`, "info");
  }

  openInWebIde() {
    const code = document.getElementById("codeViewer").value;
    const url = BangleCodeGenerator.generateWebIdeUrl(code);
    window.open(url, "_blank");
  }

  async runOnWatchBle() {
    const code = document.getElementById("codeViewer").value;
    try {
      await this.bluetooth.uploadCode(code);
    } catch (err) {
      this.log(`Bluetooth error: ${err.message}`, "err");
    }
  }

  updateBleStatus(status, isConn) {
    const badge = document.getElementById("bleStatusBadge");
    if (badge) {
      badge.textContent = status;
      badge.style.color = isConn ? "#3fb950" : "#d29922";
    }
  }

  doImport() {
    const text = document.getElementById("importCodeArea").value;
    try {
      const parsed = BangleCodeImporter.parseCode(text);
      this.currentLayout = parsed;
      this.layoutEngine = new BangleLayoutEngine(this.currentLayout, this.currentOptions, this.display.getAppRect());
      this.display.setEngine(this.layoutEngine);
      this.selectNode("0");
      this.refreshAll();
      document.getElementById("importModal").classList.remove("active");
      this.log("Successfully imported Layout structure!", "info");
    } catch (err) {
      alert(`Import error: ${err.message}`);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.appStudio = new BangleAppStudio();
});

