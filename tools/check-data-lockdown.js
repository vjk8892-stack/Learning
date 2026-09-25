#!/usr/bin/env node
/*
 * Confirms Row Level Security actually locks down public.progress and
 * public.notes: with ONLY the publishable (anon) key and no signed-in
 * session, both tables must return no rows — either an outright
 * unauthorized response, or a 200 with an empty array. Any row coming
 * back is a real data-exposure bug, not a warning.
 *
 * Usage: node tools/check-data-lockdown.js <supabaseUrl> <publishableKey>
 * Exit code 0 if both tables are locked down, 1 otherwise. Prints only
 * row counts, never row content, so nothing sensitive lands in CI logs
 * even if this ever finds a real leak.
 */
"use strict";

async function checkTable(supabaseUrl, key, table) {
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    return { table, ok: true, detail: `status ${res.status} (unauthorized, as expected)` };
  }
  if (!res.ok) {
    return { table, ok: false, detail: `unexpected status ${res.status}` };
  }
  let body;
  try {
    body = await res.json();
  } catch (e) {
    return { table, ok: false, detail: `status ${res.status} but response body was not valid JSON` };
  }
  if (!Array.isArray(body)) {
    return { table, ok: false, detail: `status ${res.status} but response body was not a JSON array` };
  }
  if (body.length === 0) {
    return { table, ok: true, detail: "status 200, empty array (RLS returned no rows, as expected)" };
  }
  return { table, ok: false, detail: `status 200 returned ${body.length} row(s) with only the publishable key — RLS is not locking this table down` };
}

async function main() {
  const [supabaseUrl, publishableKey] = process.argv.slice(2);
  if (!supabaseUrl || !publishableKey) {
    console.error("Usage: node tools/check-data-lockdown.js <supabaseUrl> <publishableKey>");
    process.exit(2);
  }

  const results = await Promise.all(["progress", "notes"].map((t) => checkTable(supabaseUrl, publishableKey, t)));
  let anyFailed = false;
  for (const r of results) {
    console.log(`${r.ok ? "OK" : "FAIL"}  public.${r.table}: ${r.detail}`);
    if (!r.ok) anyFailed = true;
  }
  if (anyFailed) process.exit(1);
}

main();
