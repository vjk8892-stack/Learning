#!/usr/bin/env node
/*
 * Extracts the phase-2 lesson content data (P2) out of js/app.js as JSON,
 * so tools/run-lessons.py can execute the REAL shipped lesson code rather
 * than a hand-copied duplicate of it.
 *
 * How: js/app.js is one big IIFE. Its first section (helpers, then the
 * content-data literals P0..P5/STRETCH/ROSETTA/FRESH/COSTS, ending at
 * "var PHASES=[P0,P1,P2,P3,P4,P5];") is pure data with no DOM/window/
 * document use, so that slice alone can be evaluated in a bare Node vm
 * context. Everything after it (renderers, event binding, sync, notes)
 * is intentionally never touched, so it doesn't matter that this script
 * has no browser globals to give it.
 *
 * Usage: node tools/extract-lessons.js [path/to/app.js] > out.json
 *        node tools/extract-lessons.js --out=tools/.extracted/p2.json
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function main() {
  const args = process.argv.slice(2);
  let appJsPath = null;
  let outPath = null;
  for (const a of args) {
    if (a.startsWith("--out=")) outPath = a.slice("--out=".length);
    else if (!a.startsWith("--")) appJsPath = a;
  }
  if (!appJsPath) appJsPath = path.join(__dirname, "..", "js", "app.js");

  const src = fs.readFileSync(appJsPath, "utf8");

  const startMarker = "var $=";
  const endMarker = "var PHASES=[P0,P1,P2,P3,P4,P5];";
  const startIdx = src.indexOf(startMarker);
  const endIdx = src.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      "Could not find the expected data-literal markers in " +
        appJsPath +
        " (looked for " +
        JSON.stringify(startMarker) +
        " and " +
        JSON.stringify(endMarker) +
        "). js/app.js's layout changed — update the markers in extract-lessons.js to match."
    );
  }
  const slice = src.slice(startIdx, endIdx + endMarker.length);

  const context = {};
  vm.createContext(context);
  try {
    vm.runInContext(slice, context, { filename: "app.js (data slice)" });
  } catch (e) {
    throw new Error(
      "Evaluating the extracted data slice failed: " +
        e.message +
        "\nThis usually means the slice pulled in code that touches window/document. " +
        "Check the markers in extract-lessons.js still bound only the pure-data section."
    );
  }

  if (!context.P2 || typeof context.P2 !== "object") {
    throw new Error("Extraction ran but context.P2 was not populated as expected.");
  }

  // Sanity checks: this is the thing CI relies on to catch a future content
  // edit silently breaking extraction (e.g. someone renames P2 or restructures tasks).
  if (!Array.isArray(context.P2.tasks) || context.P2.tasks.length === 0) {
    throw new Error("P2.tasks is missing or empty after extraction.");
  }
  let lessonCount = 0;
  for (const task of context.P2.tasks) {
    if (Array.isArray(task.subs)) lessonCount += task.subs.length;
  }
  if (lessonCount === 0) {
    throw new Error("No lessons (task.subs) found after extraction.");
  }

  const result = {
    extractedAt: new Date().toISOString(),
    sourceFile: path.relative(process.cwd(), appJsPath),
    lessonCount: lessonCount,
    taskCount: context.P2.tasks.length,
    P2: context.P2,
  };

  const json = JSON.stringify(result, null, 2);
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
    console.error(
      "Extracted " + lessonCount + " lessons across " + context.P2.tasks.length + " tasks to " + outPath
    );
  } else {
    process.stdout.write(json);
  }
}

main();
