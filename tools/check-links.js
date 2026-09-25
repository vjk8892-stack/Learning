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

// Resource-hint links (preconnect/dns-prefetch) are never meant to be fetched
// as pages: a bare origin with no path routinely 404s even when the hint is
// working exactly as intended. Skip their href values entirely.
const RESOURCE_HINT_RE = /<link\b[^>]*\brel=["'](?:preconnect|dns-prefetch)["'][^>]*>/gi;
const HREF_RE = /href=["']([^"']+)["']/i;

// Domains with bot-protection (e.g. Akamai) known to block scripted
// HEAD/GET from datacenter IPs regardless of headers sent, so a failure
// here isn't good evidence the link is actually dead. Reported separately,
// never counted as broken.
const BOT_PROTECTED_DOMAINS = ["azure.microsoft.com"];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseArgs() {
  const args = { timeout: 15000, concurrency: 6 };
  for (const a of process.argv.slice(2)) {
    const m = /^--(\w+)=(.+)$/.exec(a);
    if (m) args[m[1]] = Number(m[2]) || m[2];
  }
  return args;
}

// Known placeholder/example URLs that appear in docs prose, not as real
// links to check: `https://your-site.netlify.app` (README, illustrating a
// Supabase redirect-URL pattern) and `https://link` (index.html's in-app
// Markdown-syntax reference, showing `[label](https://link)` as example
// syntax). The bare `fonts.googleapis.com`/`fonts.gstatic.com` origins are
// CLAUDE.md prose quoting the CSP's `style-src`/`font-src` values, not
// links: Google's Fonts API serves nothing at its own root by design (the
// real, checkable stylesheet URL with its `?family=` path is unaffected).
// Listed explicitly, with reasons, rather than guessed from markup
// structure, so nothing else is silently excluded.
const IGNORE_URLS = new Set([
  "https://your-site.netlify.app",
  "https://link",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
]);

function extractLinks() {
  // Stops before a closing backtick so a markdown code span like
  // `https://cdn.jsdelivr.net` yields the real URL, not the URL plus a
  // trailing backtick.
  const urlRe = /https?:\/\/[^\s"'<>)\]`]+/g;
  const found = new Map(); // url -> Set of files it appears in
  for (const rel of SCAN_FILES) {
    const full = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(full)) continue;
    let text = fs.readFileSync(full, "utf8");
    // Resource hints (preconnect/dns-prefetch) are never meant to be
    // fetched as pages: a bare origin routinely 404s even when the hint
    // itself is working as intended.
    text = text.replace(RESOURCE_HINT_RE, "");
    let m;
    while ((m = urlRe.exec(text))) {
      let url = m[0].replace(/[.,;:]+$/, "");
      if (IGNORE_URLS.has(url)) continue;
      if (!found.has(url)) found.set(url, new Set());
      found.get(url).add(rel);
    }
  }
  return found;
}

async function checkOne(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { "User-Agent": UA };
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers });
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      // Some hosts reject HEAD outright; retry with GET before concluding anything.
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers });
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, status: null, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

function isBotProtected(url) {
  try {
    const host = new URL(url).hostname;
    return BOT_PROTECTED_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
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

  const broken = results.filter((r) => !r.ok && !isBotProtected(r.url));
  const skipped = results.filter((r) => !r.ok && isBotProtected(r.url));
  for (const r of results) {
    const files = Array.from(linkMap.get(r.url)).join(", ");
    if (r.ok) {
      console.log(`OK    ${r.status}  ${r.url}`);
    } else if (isBotProtected(r.url)) {
      // Known bot-protected domain: a scripted HEAD/GET failing here isn't
      // evidence the link is dead, so this is reported but not counted as
      // broken. Not verified — check manually in a real browser.
      console.log(`SKIP  ${r.status || "ERR"}  ${r.url}  (in ${files}, known bot-protected domain, check manually)`);
    } else {
      console.log(`BROKEN ${r.status || "ERR"}  ${r.url}  (in ${files})${r.error ? " — " + r.error : ""}`);
    }
  }

  console.log(`\n${urls.length - broken.length - skipped.length}/${urls.length} links OK` + (skipped.length ? `, ${skipped.length} skipped (bot-protected, unverified).` : "."));
  if (broken.length) {
    console.log(`${broken.length} broken link(s) found.`);
    process.exit(1);
  }
}

main();
