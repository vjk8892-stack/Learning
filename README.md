# SSIS to Fabric

An 11-week, self-paced learning path for a SQL Server / SSIS / SSRS / Power BI
developer moving to Microsoft Fabric, Spark and Delta Lake: a route chart,
six phases of tasks (57 tasks total), a 24-lesson pilot in phase 2, stretch
missions and guardrails on cost and pace.

## What's here

- `index.html` — the whole site. A single static file, no build step, no
  dependencies other than Google Fonts. Open it directly in a browser or
  serve it from any static host.
- `netlify.toml` — Netlify config (publish the repo root, basic security
  headers). No build command; there's nothing to build.
- `supabase/schema.sql` — the Postgres schema for the Learning Supabase
  project (`pdiohswlwgudikvaujen`), checked in so it's reviewable outside the
  dashboard. See below for what it's for.
- `CLAUDE.md` — the project handoff brief: what exists, design decisions,
  facts that expire and need rechecking, and the pending-work list.

## Current state

Progress is stored client-side only, in `localStorage` under the key
`ssis-to-fabric-path-v2`. There is no login yet and no sync to Supabase from
the page — the `progress` and `notes` tables and their row-level-security
policies exist in the Supabase project (see `supabase/schema.sql`), but the
auth UI and the sync layer that would read and write them haven't been built.
Until they are, this is a single-browser, single-device tool.

## Running it locally

Open `index.html` in a browser. That's it — no server, no build.

## Testing

- Syntax: extract the `<script>` body and run `node --check` on it.
- Behaviour: drive it with Playwright against `file:///.../index.html`.
  Check for console errors (the Google Fonts request will fail in a sandbox
  with no network — that's expected and fine), confirm
  `document.documentElement.scrollWidth === innerWidth` at a 390px viewport,
  and confirm ticking a task persists across a reload.

## Deploying

1. Push this repo to GitHub and connect it to Netlify (or Vercel — swap
   `netlify.toml` for a `vercel.json` if you'd rather use that). Free tier
   is enough; there's no build step to configure.
2. That's sufficient to serve the page as-is. Supabase-backed login and
   sync are not wired up yet (see "Current state" above); once they are,
   the Supabase URL and anon/publishable key get added to the page's
   config, and the two secrets above stay server-side, never in the page.

## Supabase project

Project ref `pdiohswlwgudikvaujen`. `supabase/schema.sql` is the current
live schema: `progress` (one row per user, a JSON blob) and `notes` (one row
per user per phase or lesson), both RLS-enabled and grant-restricted to the
`authenticated` role — `anon` has no SELECT/INSERT/UPDATE/DELETE on either
table. Changes to this schema should go in a new migration, applied via the
Supabase tooling, and then be reflected back into this file.
