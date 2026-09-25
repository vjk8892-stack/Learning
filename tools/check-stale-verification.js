#!/usr/bin/env node
/*
 * Fails if any lesson's `verified.date` (added per CLAUDE.md's "Pending
 * work" B/Stage 2 item — {date, level, note} on every lesson) is more
 * than 45 days old, or missing entirely once any lesson has adopted the
 * field (a mixed state — some lessons verified, others never marked —
 * is itself worth flagging rather than silently ignoring).
 *
 * Reuses tools/extract-lessons.js's data slice so this reads the same
 * lesson objects the app ships, not a separate copy of the content.
 *
 * Usage: node tools/check-stale-verification.js [--maxAgeDays=45]
 * Exit code 0 if every lesson with a verified field is within the
 * window (and, once any lesson carries the field, none lack it);
 * 1 if any is stale or missing. Prints a note (not a failure) if no
 * lesson has the field yet, since that is expected before it ships.
 */
"use strict";
const path = require("path");
const { execFileSync } = require("child_process");

function parseArgs() {
  const args = { maxAgeDays: 45 };
  for (const a of process.argv.slice(2)) {
    const m = /^--(\w+)=(.+)$/.exec(a);
    if (m) args[m[1]] = Number(m[2]) || m[2];
  }
  return args;
}

function extractP2() {
  const out = execFileSync("node", [path.join(__dirname, "extract-lessons.js")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out);
}

function main() {
  const args = parseArgs();
  const data = extractP2();
  const now = Date.now();
  const maxAgeMs = args.maxAgeDays * 24 * 60 * 60 * 1000;

  const lessons = [];
  for (const task of data.P2.tasks) {
    for (const lesson of task.subs || []) lessons.push(lesson);
  }

  const withField = lessons.filter((l) => l.verified && l.verified.date);
  if (withField.length === 0) {
    console.log("No lesson carries a `verified` field yet (expected before that work ships — see CLAUDE.md pending work). Nothing to check.");
    return;
  }

  let anyProblem = false;
  for (const lesson of lessons) {
    if (!lesson.verified || !lesson.verified.date) {
      console.log(`MISSING  ${lesson.id}: other lessons have a verified date but this one has none`);
      anyProblem = true;
      continue;
    }
    const parsed = Date.parse(lesson.verified.date);
    if (Number.isNaN(parsed)) {
      console.log(`BAD DATE ${lesson.id}: verified.date "${lesson.verified.date}" is not a parseable date`);
      anyProblem = true;
      continue;
    }
    const ageDays = Math.floor((now - parsed) / (24 * 60 * 60 * 1000));
    if (now - parsed > maxAgeMs) {
      console.log(`STALE    ${lesson.id}: verified ${ageDays} days ago (${lesson.verified.date}), older than the ${args.maxAgeDays}-day window`);
      anyProblem = true;
    } else {
      console.log(`OK       ${lesson.id}: verified ${ageDays} days ago`);
    }
  }

  if (anyProblem) process.exit(1);
}

main();
