/**
 * Unit Test Suite for Bangle.js 2 UI Designer Engine
 * Executable via GJS: gjs ui-designer/test/test-engine.js
 */

const GLib = imports.gi.GLib;

// Polyfill browser globals in GJS
globalThis.window = globalThis;
globalThis.btoa = s => GLib.base64_encode(new TextEncoder().encode(s));
globalThis.atob = s => new TextDecoder().decode(GLib.base64_decode(s));

function loadFile(relPath) {
  const [ok, contents] = GLib.file_get_contents(relPath);
  if (!ok) throw new Error("Could not read " + relPath);
  return new TextDecoder().decode(contents);
}

// Evaluate modules in order
eval(loadFile("ui-designer/js/icons.js"));
eval(loadFile("ui-designer/js/layout-engine.js"));
eval(loadFile("ui-designer/js/templates.js"));
eval(loadFile("ui-designer/js/code-generator.js"));
eval(loadFile("ui-designer/js/code-importer.js"));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    print("  [PASS] " + message);
  } else {
    failed++;
    print("  [FAIL] " + message);
  }
}

print("Running Bangle.js 2 UI Designer Engine Tests...");

// Test 1: BangleIcons
print("\n--- Testing BangleIcons ---");
assert(Array.isArray(BangleIcons.library), "Icon library is an array");
assert(BangleIcons.library.length >= 8, "Icon library has at least 8 built-in icons");
const heartIcon = BangleIcons.get("heart");
assert(heartIcon !== undefined && heartIcon.width === 16, "Heart icon retrieved with 16x16 size");
const espruinoImg = BangleIcons.toEspruinoImage(heartIcon);
assert(espruinoImg.startsWith('atob("') && espruinoImg.endsWith('")'), "toEspruinoImage outputs valid atob(...) string");

// Test 2: BangleLayoutEngine
print("\n--- Testing BangleLayoutEngine ---");
const testLayout = {
  type: "v",
  fillx: 1,
  filly: 1,
  c: [
    { type: "txt", font: "6x8:2", label: "HELLO", id: "title", filly: 1 },
    { type: "btn", font: "6x8", label: "CLICK", id: "btn1", filly: 1 },
    {
      type: "h",
      fillx: 1,
      filly: 1,
      c: [
        { type: "img", src: "steps", scale: 1 },
        { type: "txt", font: "6x8", label: "1000", id: "count" }
      ]
    }
  ]
};

const appRect = { x: 0, y: 24, w: 176, h: 152 }; // With widgets bar
const engine = new BangleLayoutEngine(testLayout, {}, appRect);

assert(engine.computedTree !== null, "Layout tree computed");
assert(engine.computedTree.w === 176, "Root width equals 176");
assert(engine.computedTree.h === 152, "Root height equals 152");
assert(engine.computedTree.x === 0, "Root x equals 0");
assert(engine.computedTree.y === 24, "Root y equals 24");

// Check children
assert(engine.computedTree.c.length === 3, "Root has 3 children");
const titleNode = engine.nodesById["title"];
assert(titleNode !== undefined, "Indexed node by ID 'title'");
assert(titleNode.y >= 24, "Title node is positioned below widget bar");

// Hit testing
const hitNode = engine.findNodeAt(88, 30);
assert(hitNode !== null, "Found node at (88, 30)");

// Test 3: BangleTemplates
print("\n--- Testing BangleTemplates ---");
assert(Array.isArray(BangleTemplates), "Templates list is an array");
assert(BangleTemplates.length >= 5, "Has at least 5 ready-to-use templates");
const digitalWatch = BangleTemplates.find(t => t.id === "digital_watchface");
assert(digitalWatch !== undefined, "Digital watch face template exists");

// Test 4: BangleCodeGenerator
print("\n--- Testing BangleCodeGenerator ---");
const generatedJs = BangleCodeGenerator.generateAppCode(testLayout, { showWidgets: true });
assert(generatedJs.includes('require("Layout")'), "Generated code includes require('Layout')");
assert(generatedJs.includes('Bangle.loadWidgets()'), "Generated code includes Bangle.loadWidgets()");
assert(generatedJs.includes('layout.render()'), "Generated code includes layout.render()");
assert(generatedJs.includes('Bangle.setUI()'), "Generated code includes Bangle.setUI()");

// Test 5: BangleCodeImporter
print("\n--- Testing BangleCodeImporter ---");
const codeToImport = `
var Layout = require("Layout");
var layout = new Layout({
  type: "v",
  c: [
    { type: "txt", font: "20%", label: "12:00", id: "clock" },
    { type: "btn", font: "6x8", label: "OK", id: "confirm" }
  ]
});
g.clear();
layout.render();
`;

const parsedLayout = BangleCodeImporter.parseCode(codeToImport);
assert(parsedLayout.type === "v", "Parsed layout has root type 'v'");
assert(parsedLayout.c.length === 2, "Parsed layout has 2 children");
assert(parsedLayout.c[0].id === "clock", "First child has ID 'clock'");

// Test 6: Node Moving and Reordering
print("\n--- Testing Node Moving & Reordering ---");
const reorderTree = {
  type: "v",
  c: [
    { type: "txt", label: "A", id: "itemA" },
    { type: "txt", label: "B", id: "itemB" },
    {
      type: "h",
      id: "row1",
      c: [
        { type: "btn", label: "C", id: "itemC" }
      ]
    }
  ]
};

const reorderEngine = new BangleLayoutEngine(reorderTree, {}, { x: 0, y: 0, w: 176, h: 176 });
// Move B before A (reorder within same parent)
const [bNode] = reorderTree.c.splice(1, 1);
reorderTree.c.splice(0, 0, bNode);
reorderEngine.originalLayout = reorderTree;
reorderEngine.prepare();

assert(reorderEngine.computedTree.c[0].id === "itemB", "Item B moved to index 0");
assert(reorderEngine.computedTree.c[1].id === "itemA", "Item A moved to index 1");

// Move C from row1 into top vertical container at index 1
const rowNode = reorderTree.c.find(n => n.id === "row1");
const [cNode] = rowNode.c.splice(0, 1);
reorderTree.c.splice(1, 0, cNode);
reorderEngine.originalLayout = reorderTree;
reorderEngine.prepare();

assert(reorderEngine.computedTree.c.length === 4, "Root container now has 4 children");
assert(reorderEngine.computedTree.c[1].id === "itemC", "Item C successfully moved between containers");

print(`\n========================================`);
print(`TEST RESULTS: ${passed} Passed, ${failed} Failed`);
print(`========================================`);

if (failed > 0) {
  imports.system.exit(1);
}

