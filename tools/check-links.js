#!/usr/bin/env node
/*
 * Finds every http(s) link referenced in the site's content and checks
 * each one resolves (HEAD, falling back to GET on a HEAD failure or a
 * 405/501), reporting any that are broken. Node 18+, no dependencies
 * (uses the built-in fetch).
 *
 * Usage: node tools/check-links.js [--timeout=15000] [--concurrency=6]
 * Exit code 0 if every link is reachable, 1 if any is broken.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const SCAN_FILES = ["index.html", "README.md", "CLAUDE.md", path.join("js", "app.js"), path.join("js", "auth.js")];

function parseArgs() {
  const args = { timeout: 15000, concurrency: 6 };
  for (const a of process.argv.slice(2)) {
    const m = /^--(\w+)=(.+)$/.exec(a);
    if (m) args[m[1]] = Number(m[2]) || m[2];
  }
  return args;
}

function extractLinks() {
  const urlRe = /https?:\/\/[^\s"'<>)\]]+/g;
  const found = new Map(); // url -> Set of files it appears in
  for (const rel of SCAN_FILES) {
    const full = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, "utf8");
    let m;
    while ((m = urlRe.exec(text))) {
      let url = m[0].replace(/[.,;:]+$/, "");
      if (!found.has(url)) found.set(url, new Set());
      found.get(url).add(rel);
    }
  }
  return found;
}

async function checkOne(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      // Some hosts reject HEAD outright; retry with GET before concluding anything.
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, status: null, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const args = parseArgs();
  const linkMap = extractLinks();
  const urls = Array.from(linkMap.keys()).sort();
  console.error(`Checking ${urls.length} unique links (timeout ${args.timeout}ms, concurrency ${args.concurrency})...`);

  const results = await mapLimit(urls, args.concurrency, async (url) => {
    // One retry for a transient failure before calling it broken.
    let r = await checkOne(url, args.timeout);
    if (!r.ok) r = await checkOne(url, args.timeout);
    return { url, ...r };
  });

  const broken = results.filter((r) => !r.ok);
  for (const r of results) {
    const files = Array.from(linkMap.get(r.url)).join(", ");
    if (r.ok) {
      console.log(`OK    ${r.status}  ${r.url}`);
    } else {
      console.log(`BROKEN ${r.status || "ERR"}  ${r.url}  (in ${files})${r.error ? " — " + r.error : ""}`);
    }
  }

  console.log(`\n${urls.length - broken.length}/${urls.length} links OK.`);
  if (broken.length) {
    console.log(`${broken.length} broken link(s) found.`);
    process.exit(1);
  }
}

main();
