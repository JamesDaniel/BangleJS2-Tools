/**
 * Bangle.js 2 UI Designer - Icon Library & Bitmap Converter
 * Provides built-in watch icons, SVG/Canvas rendering, and Espruino bitmap encoders.
 */

const BangleIcons = {
  // Built-in vector & pixel icon definitions (16x16 or 24x24 pixel grids)
  library: [
    {
      id: "heart",
      name: "Heart / HRM",
      category: "Health",
      width: 16,
      height: 16,
      // 16x16 1-bpp bitmap rows
      pixels: [
        "0000000000000000",
        "0111000000011100",
        "1111100000111110",
        "1111110001111110",
        "1111111011111110",
        "1111111111111110",
        "0111111111111100",
        "0111111111111100",
        "0011111111111000",
        "0001111111110000",
        "0000111111100000",
        "0000011111000000",
        "0000001110000000",
        "0000000100000000",
        "0000000000000000",
        "0000000000000000"
      ]
    },
    {
      id: "steps",
      name: "Steps / Shoe",
      category: "Health",
      width: 16,
      height: 16,
      pixels: [
        "0000000000000000",
        "0000001111000000",
        "0000011111100000",
        "0000111111100000",
        "0000111111000000",
        "0000011110000000",
        "0000001100000000",
        "0000000000000000",
        "0011110000000000",
        "0111111000000000",
        "0111111100000000",
        "0011111100000000",
        "0001111000000000",
        "0000110000000000",
        "0000000000000000",
        "0000000000000000"
      ]
    },
    {
      id: "battery",
      name: "Battery (Full)",
      category: "System",
      width: 18,
      height: 10,
      pixels: [
        "000000000000000000",
        "111111111111111000",
        "100000000000001000",
        "101101101101101110",
        "101101101101101010",
        "101101101101101010",
        "101101101101101110",
        "100000000000001000",
        "111111111111111000",
        "000000000000000000"
      ]
    },
    {
      id: "bluetooth",
      name: "Bluetooth",
      category: "System",
      width: 12,
      height: 16,
      pixels: [
        "000010000000",
        "000011000000",
        "000010100000",
        "100010010000",
        "010010010000",
        "001010100000",
        "000111000000",
        "000010000000",
        "000111000000",
        "001010100000",
        "010010010000",
        "100010010000",
        "000010100000",
        "000011000000",
        "000010000000",
        "000000000000"
      ]
    },
    {
      id: "clock",
      name: "Clock / Time",
      category: "Time",
      width: 16,
      height: 16,
      pixels: [
        "0000011111000000",
        "0001100000110000",
        "0010000000001000",
        "0100000100000100",
        "0100000100000100",
        "1000000100000010",
        "1000000100000010",
        "1000000111100010",
        "1000000000000010",
        "1000000000000010",
        "0100000000000100",
        "0100000000000100",
        "0010000000001000",
        "0001100000110000",
        "0000011111000000",
        "0000000000000000"
      ]
    },
    {
      id: "settings",
      name: "Settings / Gear",
      category: "System",
      width: 16,
      height: 16,
      pixels: [
        "0000001111000000",
        "0000001111000000",
        "0100011111100010",
        "0110111001110110",
        "0011100000011100",
        "0011000000001100",
        "1110000000000111",
        "1110000110000111",
        "1110000110000111",
        "1110000000000111",
        "0011000000001100",
        "0011100000011100",
        "0110111001110110",
        "0100011111100010",
        "0000001111000000",
        "0000001111000000"
      ]
    },
    {
      id: "play",
      name: "Play",
      category: "Media",
      width: 16,
      height: 16,
      pixels: [
        "0010000000000000",
        "0011000000000000",
        "0011100000000000",
        "0011110000000000",
        "0011111000000000",
        "0011111100000000",
        "0011111110000000",
        "0011111111000000",
        "0011111111000000",
        "0011111110000000",
        "0011111100000000",
        "0011111000000000",
        "0011110000000000",
        "0011100000000000",
        "0011000000000000",
        "0010000000000000"
      ]
    },
    {
      id: "pause",
      name: "Pause",
      category: "Media",
      width: 16,
      height: 16,
      pixels: [
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0011100000111000",
        "0000000000000000"
      ]
    },
    {
      id: "check",
      name: "Checkmark",
      category: "Action",
      width: 16,
      height: 16,
      pixels: [
        "0000000000000000",
        "0000000000000010",
        "0000000000000110",
        "0000000000001100",
        "0000000000011000",
        "0000000000110000",
        "0000000001100000",
        "0000000011000000",
        "0100000110000000",
        "0110001100000000",
        "0011011000000000",
        "0001110000000000",
        "0000100000000000",
        "0000000000000000",
        "0000000000000000",
        "0000000000000000"
      ]
    },
    {
      id: "alert",
      name: "Alert / Warning",
      category: "Action",
      width: 16,
      height: 16,
      pixels: [
        "0000000110000000",
        "0000001111000000",
        "0000001111000000",
        "0000011001100000",
        "0000011001100000",
        "0000110110110000",
        "0000110110110000",
        "0001100110011000",
        "0001100110011000",
        "0011000000001100",
        "0011000110001100",
        "0110000110000110",
        "0111111111111110",
        "0111111111111110",
        "0000000000000000",
        "0000000000000000"
      ]
    },
    {
      id: "sun",
      name: "Sun / Weather",
      category: "Weather",
      width: 16,
      height: 16,
      pixels: [
        "0000000100000000",
        "0100000100000010",
        "0010000000000100",
        "0000011111000000",
        "0001111111110000",
        "0011111111111000",
        "0011111111111000",
        "1111111111111111",
        "0011111111111000",
        "0011111111111000",
        "0001111111110000",
        "0000011111000000",
        "0010000000000100",
        "0100000100000010",
        "0000000100000000",
        "0000000000000000"
      ]
    }
  ],

  /**
   * Find icon definition by ID
   */
  get(id) {
    return this.library.find(i => i.id === id);
  },

  /**
   * Encodes an icon definition into Espruino Graphics bitmap string representation
   * Espruino image format:
   * byte 0: width
   * byte 1: height
   * byte 2: bpp (1 for 1bpp)
   * bytes 3..: bits (MSB first)
   */
  toEspruinoImage(icon) {
    const w = icon.width;
    const h = icon.height;
    const bpp = 1;
    const bytes = [w, h, bpp];

    let currentByte = 0;
    let bitCount = 0;

    for (let y = 0; y < h; y++) {
      const row = icon.pixels[y] || "";
      for (let x = 0; x < w; x++) {
        const bit = row[x] === "1" ? 1 : 0;
        currentByte = (currentByte << 1) | bit;
        bitCount++;
        if (bitCount === 8) {
          bytes.push(currentByte);
          currentByte = 0;
          bitCount = 0;
        }
      }
    }
    if (bitCount > 0) {
      currentByte = currentByte << (8 - bitCount);
      bytes.push(currentByte);
    }

    // Convert to binary string
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }

    // Return as atob("...") format
    return `atob("${btoa(binaryStr)}")`;
  },

  /**
   * Render an icon definition onto an HTML5 Canvas 2D context
   */
  renderToCanvas(ctx, icon, x, y, scale = 1, color = "#ffffff") {
    if (!icon || !icon.pixels) return;
    ctx.fillStyle = color;
    const w = icon.width;
    const h = icon.height;
    for (let r = 0; r < h; r++) {
      const row = icon.pixels[r] || "";
      for (let c = 0; c < w; c++) {
        if (row[c] === "1") {
          ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
        }
      }
    }
  },

  /**
   * Convert an HTML Image or Canvas to an Espruino 1bpp bitmap object
   */
  fromCanvas(canvas, threshold = 128) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h).data;
    const pixels = [];

    for (let y = 0; y < h; y++) {
      let row = "";
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const a = imgData[idx + 3];
        const brightness = (r + g + b) / 3;
        const isSet = a > 64 && brightness > threshold;
        row += isSet ? "1" : "0";
      }
      pixels.push(row);
    }

    return {
      id: "custom_" + Date.now(),
      name: "Custom Icon",
      category: "Custom",
      width: w,
      height: h,
      pixels: pixels
    };
  }
};

if (typeof globalThis !== "undefined") {
  globalThis.BangleIcons = BangleIcons;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleIcons;
}
