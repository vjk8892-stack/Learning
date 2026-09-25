#!/usr/bin/env node
/*
 * Fetches the DP-600, DP-700 and PL-300 Microsoft Learn study guide pages,
 * looks for the "Skills measured as of <date>" line each one publishes,
 * and compares it against the value recorded in data/watch.json. Reports
 * a change (the outline moved and lessons may need rechecking) or a
 * parse failure (the page's markup changed and this script can't find
 * the line any more) — it never edits data/watch.json or any lesson
 * itself; a human decides what changed and updates both.
 *
 * The exact selector this looks for has NOT been verified against the
 * live pages from a working sandbox (this repo's dev sandbox has no
 * egress to learn.microsoft.com), only reasoned from how Microsoft Learn
 * certification pages are known to render "Skills measured as of ...".
 * The first real run of weekly-checks.yml is the actual verification of
 * this script; if it reports a parse failure on every page, the pattern
 * below needs adjusting to match the real markup, not the outline dates.
 *
 * Usage: node tools/check-exam-outlines.js [--timeout=20000]
 * Exit code 0 if every page's date still matches data/watch.json,
 * 1 if any changed or any page could not be parsed.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const WATCH_PATH = path.join(REPO_ROOT, "data", "watch.json");

// Matches "Skills measured as of <Month> <Day>, <Year>" (the wording
// Microsoft Learn certification study guides use), case-insensitively,
// allowing for the date to use a non-breaking space or ordinary space.
const SKILLS_MEASURED_RE = /skills measured as of\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i;

function parseArgs() {
  const args = { timeout: 20000 };
  for (const a of process.argv.slice(2)) {
    const m = /^--(\w+)=(.+)$/.exec(a);
    if (m) args[m[1]] = Number(m[2]) || m[2];
  }
  return args;
}

async function fetchText(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = parseArgs();
  const watch = JSON.parse(fs.readFileSync(WATCH_PATH, "utf8"));

  let anyProblem = false;
  for (const [key, entry] of Object.entries(watch)) {
    process.stdout.write(`${key} (${entry.url}): `);
    let html;
    try {
      html = await fetchText(entry.url, args.timeout);
    } catch (e) {
      console.log(`FETCH FAILED — ${e.message}`);
      anyProblem = true;
      continue;
    }
    const match = SKILLS_MEASURED_RE.exec(html);
    if (!match) {
      console.log("PARSE FAILURE — could not find a 'Skills measured as of' line. The page's markup may have changed; this script's pattern needs updating, not the recorded date.");
      anyProblem = true;
      continue;
    }
    const found = match[1].replace(/\s+/g, " ").trim();
    if (found === entry.skillsMeasuredAsOf) {
      console.log(`unchanged (${found})`);
    } else {
      console.log(`CHANGED — data/watch.json says "${entry.skillsMeasuredAsOf}", the live page now says "${found}". Recheck the affected lessons, then update both data/watch.json and the lesson content together.`);
      anyProblem = true;
    }
  }

  if (anyProblem) process.exit(1);
}

main();
