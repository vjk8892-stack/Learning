#!/usr/bin/env node
/*
 * Checks the live deployed site's response: the noindex meta tag is
 * present, the Content-Security-Policy's script-src has no
 * 'unsafe-inline', and connect-src is limited to 'self' plus the
 * configured Supabase origin.
 *
 * Usage: node tools/check-site-headers.js <siteUrl> <supabaseUrl>
 * Exit code 0 if all three hold, 1 otherwise.
 */
"use strict";

function parseCsp(cspHeader) {
  const directives = {};
  for (const part of cspHeader.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    directives[tokens[0]] = tokens.slice(1);
  }
  return directives;
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch (e) {
    return null;
  }
}

function checkCsp(cspHeader, supabaseUrl) {
  const problems = [];
  if (!cspHeader) {
    problems.push("no Content-Security-Policy header was sent at all");
    return problems;
  }
  const directives = parseCsp(cspHeader);

  const scriptSrc = directives["script-src"] || [];
  if (scriptSrc.some((v) => v.replace(/'/g, "") === "unsafe-inline")) {
    problems.push("script-src allows 'unsafe-inline'");
  }
  if (scriptSrc.length === 0) {
    problems.push("script-src directive is missing");
  }

  const connectSrc = directives["connect-src"] || [];
  const supabaseOrigin = originOf(supabaseUrl);
  const allowed = new Set(["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])]);
  const unexpected = connectSrc.filter((v) => !allowed.has(v));
  if (connectSrc.length === 0) {
    problems.push("connect-src directive is missing");
  } else if (unexpected.length) {
    problems.push(`connect-src allows unexpected origins: ${unexpected.join(", ")} (expected only 'self' and ${supabaseOrigin})`);
  }

  return problems;
}

async function main() {
  const [siteUrl, supabaseUrl] = process.argv.slice(2);
  if (!siteUrl || !supabaseUrl) {
    console.error("Usage: node tools/check-site-headers.js <siteUrl> <supabaseUrl>");
    process.exit(2);
  }

  const res = await fetch(siteUrl, { redirect: "follow" });
  const cspHeader = res.headers.get("content-security-policy");
  const html = await res.text();

  const problems = checkCsp(cspHeader, supabaseUrl);

  const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
  if (!hasNoindex) {
    problems.push("no <meta name=\"robots\" content=\"noindex\"> found in the page");
  }

  if (problems.length) {
    console.log(`${problems.length} problem(s) with ${siteUrl}:`);
    for (const p of problems) console.log(` - ${p}`);
    process.exit(1);
  }
  console.log(`${siteUrl}: noindex present, CSP script-src has no unsafe-inline, connect-src limited to self + Supabase.`);
}

// Exposed for a local, offline unit-style check of the parsing logic
// (tools/check-site-headers.js can't reach the real deployed site from
// every environment; this lets the logic itself still be verified).
module.exports = { checkCsp };

if (require.main === module) {
  main();
}
