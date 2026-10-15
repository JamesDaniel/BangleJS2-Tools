/**
 * Bangle.js 2 Web Bluetooth Direct-to-Watch Uploader
 * Connects directly to Bangle.js 2 via BLE Nordic UART Service and uploads/runs code.
 */

class BangleBluetooth {
  constructor(options = {}) {
    this.onStatusChange = options.onStatusChange || null;
    this.onLog = options.onLog || null;

    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.isConnected = false;

    this.NORDIC_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    this.NORDIC_TX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // Watch RX (send to watch)
    this.NORDIC_RX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // Watch TX (receive from watch)
  }

  isSupported() {
    return navigator.bluetooth !== undefined;
  }

  log(msg) {
    if (this.onLog) this.onLog(msg);
  }

  updateStatus(status, isConn = false) {
    this.isConnected = isConn;
    if (this.onStatusChange) this.onStatusChange(status, isConn);
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error("Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.");
    }

    try {
      this.updateStatus("Requesting Bluetooth device...", false);
      this.log("Scanning for Bangle.js 2...");

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "Bangle.js" }],
        optionalServices: [this.NORDIC_SERVICE]
      });

      this.device.addEventListener("gattserverdisconnected", () => {
        this.updateStatus("Disconnected", false);
        this.log(`Disconnected from ${this.device.name || "Bangle.js"}`);
        this.txCharacteristic = null;
        this.rxCharacteristic = null;
      });

      this.updateStatus(`Connecting to ${this.device.name}...`, false);
      this.server = await this.device.gatt.connect();

      this.updateStatus("Discovering UART Service...", false);
      const service = await this.server.getPrimaryService(this.NORDIC_SERVICE);

      this.txCharacteristic = await service.getCharacteristic(this.NORDIC_TX);
      this.rxCharacteristic = await service.getCharacteristic(this.NORDIC_RX);

      // Listen for REPL output
      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
        const value = new TextDecoder().decode(event.target.value);
        this.log(`[Watch] ${value}`);
      });

      this.updateStatus(`Connected: ${this.device.name}`, true);
      this.log(`Successfully paired with ${this.device.name}!`);
      return true;
    } catch (err) {
      this.updateStatus("Connection failed", false);
      this.log(`Error: ${err.message}`);
      throw err;
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
    this.updateStatus("Disconnected", false);
  }

  /**
   * Upload and execute code in watch RAM
   */
  async uploadCode(code) {
    if (!this.isConnected || !this.txCharacteristic) {
      await this.connect();
    }

    this.log("Preparing to send code to Bangle.js 2...");
    this.updateStatus("Uploading to watch...", true);

    // Ctrl+C to interrupt any running app, then \x10 for quiet execution mode
    const payload = `\x03\x10${code}\n`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    // BLE MTU chunk size (20 bytes per write)
    const CHUNK_SIZE = 20;
    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(data.length, start + CHUNK_SIZE);
      const chunk = data.slice(start, end);

      await this.txCharacteristic.writeValueWithoutResponse(chunk);
      // Small pause to avoid buffer overflow on Nordic nRF52840
      await new Promise((r) => setTimeout(r, 15));
    }

    this.log("Upload complete! App is now running live on watch.");
    this.updateStatus(`Connected: ${this.device.name}`, true);
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleBluetooth;
}

