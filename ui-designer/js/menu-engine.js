/**
 * Bangle.js 2 Graphical Menu Simulator
 * Simulates E.showMenu() with scrolling, title bar, value formatters, booleans, and steppers.
 */

class BangleMenuEngine {
  constructor(menuObject, display) {
    this.menu = menuObject || {
      "": { title: "-- Main Menu --" },
      "Item 1": () => {},
      "Enabled": { value: true },
      "Brightness": { value: 70, min: 0, max: 100, step: 10 }
    };
    this.display = display;
    this.scrollOffset = 0;
    this.selectedItemIndex = 0;
    this.itemHeight = 24;
  }

  setMenu(menuObject) {
    this.menu = menuObject;
    this.scrollOffset = 0;
    this.selectedItemIndex = 0;
  }

  getItemList() {
    const items = [];
    let title = null;
    for (const key of Object.keys(this.menu)) {
      if (key === "") {
        if (this.menu[""] && this.menu[""].title) {
          title = this.menu[""].title;
        }
      } else {
        items.push({
          key: key,
          def: this.menu[key]
        });
      }
    }
    return { title, items };
  }

  handleClick(x, y) {
    const { title, items } = this.getItemList();
    const appRect = this.display.getAppRect();
    const titleHeight = title ? 24 : 0;
    const menuTop = appRect.y + titleHeight;

    if (y < menuTop || y > appRect.y + appRect.h) return null;

    const clickedIndex = Math.floor((y - menuTop) / this.itemHeight) + this.scrollOffset;
    if (clickedIndex >= 0 && clickedIndex < items.length) {
      const item = items[clickedIndex];
      const def = item.def;

      if (typeof def === "function") {
        def();
        return `Triggered action '${item.key}'`;
      } else if (def && typeof def === "object") {
        if (typeof def.value === "boolean") {
          def.value = !def.value;
          if (def.onchange) def.onchange(def.value);
          return `Toggled '${item.key}' -> ${def.value ? "On" : "Off"}`;
        } else if (typeof def.value === "number") {
          const step = def.step || 1;
          const min = def.min !== undefined ? def.min : 0;
          const max = def.max !== undefined ? def.max : 100;
          if (x > appRect.w / 2) {
            def.value = Math.min(max, def.value + step);
          } else {
            def.value = Math.max(min, def.value - step);
          }
          if (def.onchange) def.onchange(def.value);
          return `Changed '${item.key}' -> ${def.value}`;
        }
      }
    }
    return null;
  }

  render(ctx) {
    const appRect = this.display.getAppRect();
    const { title, items } = this.getItemList();

    // Menu background
    ctx.fillStyle = this.display.to3BitColor("#000000");
    ctx.fillRect(appRect.x, appRect.y, appRect.w, appRect.h);

    let currentY = appRect.y;

    // Title bar
    if (title) {
      ctx.fillStyle = this.display.to3BitColor("#142030");
      ctx.fillRect(appRect.x, currentY, appRect.w, 24);

      ctx.fillStyle = this.display.to3BitColor("#00ffff");
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, appRect.x + appRect.w / 2, currentY + 12);

      ctx.strokeStyle = this.display.to3BitColor("#00ffff");
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(appRect.x, currentY + 23.5);
      ctx.lineTo(appRect.x + appRect.w, currentY + 23.5);
      ctx.stroke();

      currentY += 24;
    }

    // Render Items
    const visibleCount = Math.floor((appRect.y + appRect.h - currentY) / this.itemHeight);
    for (let i = 0; i < visibleCount; i++) {
      const idx = i + this.scrollOffset;
      if (idx >= items.length) break;

      const item = items[idx];
      const rowY = currentY + i * this.itemHeight;

      // Row separator
      ctx.strokeStyle = this.display.to3BitColor("#1e2838");
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(appRect.x + 4, rowY + this.itemHeight - 0.5);
      ctx.lineTo(appRect.x + appRect.w - 4, rowY + this.itemHeight - 0.5);
      ctx.stroke();

      // Item label
      ctx.fillStyle = this.display.to3BitColor("#ffffff");
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.key, appRect.x + 10, rowY + this.itemHeight / 2);

      // Item value
      const def = item.def;
      let valStr = "";
      let valColor = "#00ffff";

      if (typeof def === "function") {
        valStr = ">";
        valColor = "#888888";
      } else if (def && typeof def === "object") {
        if (typeof def.value === "boolean") {
          valStr = def.format ? def.format(def.value) : (def.value ? "Yes" : "No");
          valColor = def.value ? "#00ff00" : "#ff4444";
        } else if (typeof def.value === "number") {
          valStr = def.format ? def.format(def.value) : String(def.value);
          valColor = "#ffff00";
        }
      }

      if (valStr) {
        ctx.fillStyle = this.display.to3BitColor(valColor);
        ctx.textAlign = "right";
        ctx.fillText(valStr, appRect.x + appRect.w - 10, rowY + this.itemHeight / 2);
      }
    }
  }

  generateCode() {
    const serializeDef = (def) => {
      if (typeof def === "function") {
        return `function() {\n    // Action handler\n  }`;
      } else if (def && typeof def === "object") {
        const parts = [];
        if (def.value !== undefined) {
          parts.push(`value: ${JSON.stringify(def.value)}`);
        }
        if (def.min !== undefined) parts.push(`min: ${def.min}`);
        if (def.max !== undefined) parts.push(`max: ${def.max}`);
        if (def.step !== undefined) parts.push(`step: ${def.step}`);
        if (typeof def.value === "boolean") {
          parts.push(`format: v => v ? "On" : "Off"`);
        }
        parts.push(`onchange: function(v) {\n    print("Changed to:", v);\n  }`);
        return `{\n    ${parts.join(",\n    ")}\n  }`;
      }
      return "undefined";
    };

    const entries = [];
    for (const [key, val] of Object.entries(this.menu)) {
      if (key === "") {
        entries.push(`  "": { title: ${JSON.stringify(val.title || "Menu")} }`);
      } else {
        entries.push(`  ${JSON.stringify(key)}: ${serializeDef(val)}`);
      }
    }

    return `// Bangle.js 2 Graphical Menu
var menu = {
${entries.join(",\n")}
};

g.clear();
Bangle.loadWidgets();
Bangle.drawWidgets();
E.showMenu(menu);
`;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleMenuEngine;
}

