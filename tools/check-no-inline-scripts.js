#!/usr/bin/env node
/*
 * Confirms index.html has no inline <script> bodies — the CSP's
 * script-src has no 'unsafe-inline', so any inline script would be
 * silently broken in the browser rather than caught here; this makes
 * that failure loud and immediate in CI instead.
 *
 * A <script src="..."> tag (with or without defer/async, self-closing
 * or with an empty body) is fine. A <script>...</script> with any
 * non-whitespace content and no src attribute is not.
 *
 * Usage: node tools/check-no-inline-scripts.js [path/to/index.html]
 * Exit code 0 if clean, 1 if an inline script body was found.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const file = process.argv[2] || path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(file, "utf8");

const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m;
let bad = 0;
while ((m = scriptRe.exec(html))) {
  const attrs = m[1];
  const body = m[2];
  const hasSrc = /\bsrc\s*=/.test(attrs);
  if (!hasSrc && body.trim().length > 0) {
    const line = html.slice(0, m.index).split("\n").length;
    console.log(`Inline script body found at ${file}:${line} (no src attribute, non-empty body).`);
    bad++;
  }
}

if (bad) {
  console.log(`${bad} inline script(s) found — the CSP's script-src has no 'unsafe-inline', so these would fail in a real browser.`);
  process.exit(1);
}
console.log(`No inline script bodies found in ${file}.`);
