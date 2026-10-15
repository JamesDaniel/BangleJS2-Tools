/**
 * Bangle.js 2 Pre-built UI Templates
 * Ready-to-use layouts demonstrating best practices for the 176x176 display.
 */

const BangleTemplates = [
  {
    id: "digital_watchface",
    name: "Digital Watch Face",
    category: "Clocks",
    description: "Classic digital clock with date, time, step count, and heart rate indicator.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      c: [
        { type: "txt", font: "6x8:2", label: "MON 19 OCT", id: "date", col: "#00ffff", filly: 1 },
        { type: "txt", font: "32%", label: "10:42", id: "time", col: "#ffffff", filly: 2 },
        { type: "", height: 4 },
        {
          type: "h",
          fillx: 1,
          filly: 1,
          c: [
            {
              type: "h",
              fillx: 1,
              halign: -1,
              c: [
                { type: "img", src: "steps", scale: 1 },
                { type: "", width: 4 },
                { type: "txt", font: "6x8", label: "6,240", id: "steps", col: "#00ff00" }
              ]
            },
            {
              type: "h",
              fillx: 1,
              halign: 1,
              c: [
                { type: "img", src: "heart", scale: 1 },
                { type: "", width: 4 },
                { type: "txt", font: "6x8", label: "74 bpm", id: "hrm", col: "#ff0055" }
              ]
            }
          ]
        }
      ]
    },
    codeSnippet: `// Digital Watch Face Update Routine
function draw() {
  var d = new Date();
  var timeStr = require("locale").time(d, 1);
  var dateStr = require("locale").date(d).toUpperCase();
  layout.time.label = timeStr;
  layout.date.label = dateStr;
  layout.render();
}
setInterval(draw, 1000);
draw();`
  },
  {
    id: "fitness_dashboard",
    name: "Fitness Dashboard",
    category: "Health",
    description: "Multi-sensor activity monitor displaying HRM, steps, calories, and workout action.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      c: [
        { type: "txt", font: "6x8:2", label: "DAILY STATS", col: "#ffff00", filly: 1 },
        {
          type: "h",
          fillx: 1,
          filly: 2,
          c: [
            {
              type: "v",
              fillx: 1,
              c: [
                { type: "img", src: "steps", scale: 1 },
                { type: "txt", font: "6x8:2", label: "8,450", id: "steps", col: "#00ff00" },
                { type: "txt", font: "6x8", label: "steps", col: "#888888" }
              ]
            },
            {
              type: "v",
              fillx: 1,
              c: [
                { type: "img", src: "heart", scale: 1 },
                { type: "txt", font: "6x8:2", label: "82", id: "bpm", col: "#ff0055" },
                { type: "txt", font: "6x8", label: "bpm", col: "#888888" }
              ]
            }
          ]
        },
        {
          type: "btn",
          label: "START RUN",
          font: "6x8:2",
          btnBorderCol: "#00ff00",
          col: "#00ff00",
          filly: 1,
          cb: "() => Bangle.buzz(100)"
        }
      ]
    }
  },
  {
    id: "media_controller",
    name: "Media Controller",
    category: "Tools",
    description: "Bluetooth music control with track info, progress bar, and touch playback buttons.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      c: [
        { type: "txt", font: "6x8:2", label: "Midnight City", id: "track", col: "#ffffff", filly: 1 },
        { type: "txt", font: "6x8", label: "M83", id: "artist", col: "#00ffff", filly: 1 },
        { type: "custom", height: 8, fillx: 1, id: "progress" },
        { type: "", height: 6 },
        {
          type: "h",
          fillx: 1,
          filly: 2,
          c: [
            { type: "btn", label: "|<", font: "6x8:2", fillx: 1, cb: "() => print('Prev')" },
            { type: "btn", label: "||", font: "6x8:2", fillx: 1, btnBorderCol: "#00ffff", cb: "() => print('Play/Pause')" },
            { type: "btn", label: ">|", font: "6x8:2", fillx: 1, cb: "() => print('Next')" }
          ]
        }
      ]
    }
  },
  {
    id: "stopwatch_timer",
    name: "Stopwatch / Lap Timer",
    category: "Tools",
    description: "High-contrast digital stopwatch with lap recording and reset controls.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      c: [
        { type: "txt", font: "6x8", label: "STOPWATCH", col: "#888888", filly: 1 },
        { type: "txt", font: "25%", label: "00:14.8", id: "time", col: "#ffff00", filly: 2 },
        { type: "txt", font: "6x8", label: "Lap 3: 00:04.2", id: "lap", col: "#00ffff", filly: 1 },
        {
          type: "h",
          fillx: 1,
          filly: 2,
          c: [
            { type: "btn", label: "RESET", font: "6x8", fillx: 1, cb: "() => print('Reset')" },
            { type: "btn", label: "START", font: "6x8:2", fillx: 1, btnBorderCol: "#00ff00", col: "#00ff00", cb: "() => print('Start')" }
          ]
        }
      ]
    }
  },
  {
    id: "counter_app",
    name: "Interactive Counter",
    category: "Games & Utilities",
    description: "Simple counter with big increment/decrement touch buttons.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      c: [
        { type: "txt", font: "6x8:2", label: "COUNTER", col: "#00ffff", filly: 1 },
        { type: "txt", font: "30%", label: "42", id: "count", col: "#ffffff", filly: 2 },
        {
          type: "h",
          fillx: 1,
          filly: 2,
          c: [
            { type: "btn", label: " - ", font: "6x8:3", fillx: 1, cb: "() => { count--; layout.count.label = count; layout.render(); }" },
            { type: "btn", label: " + ", font: "6x8:3", fillx: 1, btnBorderCol: "#00ff00", col: "#00ff00", cb: "() => { count++; layout.count.label = count; layout.render(); }" }
          ]
        }
      ]
    }
  },
  {
    id: "confirmation_dialog",
    name: "Confirmation Dialog",
    category: "Prompts",
    description: "Clean modal prompt with icon, wrapped message text, and Yes/No actions.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      pad: 4,
      c: [
        { type: "img", src: "alert", scale: 2, filly: 1 },
        { type: "txt", font: "6x8:2", label: "DELETE FILE?", col: "#ff0055", filly: 1 },
        { type: "txt", font: "6x8", label: "This action cannot be undone.", wrap: true, col: "#aaaaaa", filly: 1 },
        {
          type: "h",
          fillx: 1,
          filly: 1,
          c: [
            { type: "btn", label: "CANCEL", font: "6x8", fillx: 1, cb: "() => print('Cancel')" },
            { type: "btn", label: "CONFIRM", font: "6x8", fillx: 1, btnBorderCol: "#ff0055", col: "#ff0055", cb: "() => print('Confirmed')" }
          ]
        }
      ]
    }
  },
  {
    id: "weather_card",
    name: "Weather Forecast",
    category: "Information",
    description: "Weather snapshot with condition icon, big temperature, and humidity reading.",
    layout: {
      type: "v",
      fillx: 1,
      filly: 1,
      c: [
        { type: "txt", font: "6x8:2", label: "CAMBRIDGE", col: "#00ffff", filly: 1 },
        {
          type: "h",
          fillx: 1,
          filly: 2,
          c: [
            { type: "img", src: "sun", scale: 2, fillx: 1 },
            { type: "txt", font: "28%", label: "21 C", id: "temp", col: "#ffff00", fillx: 1 }
          ]
        },
        { type: "txt", font: "6x8", label: "Humidity: 65%  Wind: 14kph", col: "#aaaaaa", filly: 1 }
      ]
    }
  }
];

if (typeof globalThis !== "undefined") {
  globalThis.BangleTemplates = BangleTemplates;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = BangleTemplates;
}
