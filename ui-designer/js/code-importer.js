/**
 * Bangle.js 2 Code Importer
 * Parses existing Bangle.js Layout code and converts it into the visual designer format.
 */

class BangleCodeImporter {
  static extractBalancedBraces(str, startIndex = 0) {
    let depth = 0;
    let start = -1;
    let inString = false;
    let stringChar = "";
    let isEscaped = false;

    for (let i = startIndex; i < str.length; i++) {
      const ch = str[i];
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (ch === "\\") {
        isEscaped = true;
        continue;
      }
      if (inString) {
        if (ch === stringChar) inString = false;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = true;
        stringChar = ch;
        continue;
      }

      if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          return str.slice(start, i + 1);
        }
      }
    }
    return null;
  }

  /**
   * Parse code string and extract the Layout hierarchy object
   */
  static parseCode(code) {
    if (!code || typeof code !== "string") {
      throw new Error("No code provided for import.");
    }

    const trimmed = code.trim();

    // Direct JSON object
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // Fall through to JS evaluation parser
      }
    }

    // Look for new Layout(...) or first {
    let searchIdx = 0;
    const layoutIdx = trimmed.indexOf("new Layout");
    if (layoutIdx !== -1) {
      searchIdx = trimmed.indexOf("(", layoutIdx);
      if (searchIdx === -1) searchIdx = layoutIdx;
    }

    const layoutObjStr = this.extractBalancedBraces(trimmed, searchIdx);
    if (!layoutObjStr) {
      throw new Error("Could not find a valid Layout object in the provided code.");
    }

    // Safely evaluate layout object expression in isolated context
    try {
      const sandboxFn = new Function(
        "atob",
        "require",
        "Bangle",
        "g",
        `return (${layoutObjStr});`
      );

      const mockRequire = (mod) => ({});
      const mockBangle = { appRect: { x: 0, y: 0, w: 176, h: 176 } };
      const mockG = { theme: { fg: "#ffffff", bg: "#000000", fg2: "#00ffff", bg2: "#141e28" } };

      const parsed = sandboxFn(atob, mockRequire, mockBangle, mockG);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Parsed result is not an object.");
      }

      return parsed;
    } catch (err) {
      throw new Error(`Failed to parse layout expression: ${err.message}`);
    }
  }
}

if (typeof globalThis !== "undefined") {
  globalThis.BangleCodeImporter = BangleCodeImporter;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleCodeImporter;
}

