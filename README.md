# SSIS to Fabric

An 11-week, self-paced learning path for a SQL Server / SSIS / SSRS / Power BI
developer moving to Microsoft Fabric, Spark and Delta Lake: a route chart,
six phases of tasks (50 tasks total), a 24-lesson pilot in phase 2, stretch
missions and guardrails on cost and pace.

## What's here

- `index.html` — the page markup and styles. Plain HTML and CSS, no build
  step, no dependencies other than Google Fonts and (for login) a pinned
  `@supabase/supabase-js` build from jsDelivr.
- `js/early.js` — a tiny blocking script that adds a `.js` class before
  first paint, so scroll-reveal animations start hidden with no flash.
- `js/app.js` — the page's own logic: content, rendering, progress,
  export/import.
- `js/auth.js` — the login gate: checks the session, shows the splash,
  login card or app, wires up sign-in/sign-out and the lockout.
- `config.js` — the Supabase project URL and publishable key (see "Login
  and privacy" below). Both are safe to be public.
- `netlify.toml` — Netlify config: publish the repo root, security headers
  including a Content-Security-Policy. No build command; there's nothing
  to build.
- `robots.txt` and a `noindex` meta tag — this is a private work-in-progress
  page, not something to index.
- `supabase/schema.sql` — the Postgres schema for the Learning Supabase
  project (`pdiohswlwgudikvaujen`), checked in so it's reviewable outside the
  dashboard. See "Supabase project" below.
- `CLAUDE.md` — the project handoff brief: what exists, design decisions,
  facts that expire and need rechecking, and the pending-work list.

## Login and privacy — read this before relying on it

This is a **lock screen**, not real content protection. The page still ships
every lesson's full text in `js/app.js`, which anyone can read from the
browser's dev tools or "view source" whether or not they are signed in — the
login gate just hides the rendered page behind a splash and a sign-in form so
a casual visitor doesn't see it. The thing that actually protects your data
is Row Level Security on the Supabase `progress` and `notes` tables: only a
signed-in request whose `auth.uid()` matches a row's `user_id` can read or
write it (see `supabase/schema.sql`), and the anonymous role has no access
to either table at all. If that distinction matters for your use of this
page, treat the lesson content as public and the stored progress/notes as
the only thing actually locked down.

If `config.js` is missing or has no URL/key set, the page skips login
entirely, shows a "local-only mode" banner, and works from `localStorage`
only — there's nothing to sign in to in that case.

Sign-ups are meant to be switched off in the Supabase Auth settings once the
one intended user has an account, so this stays a single-user page.

## Current state

Progress is stored client-side in `localStorage` under the key
`ssis-to-fabric-path-v2`, plus export/import as JSON from the footer. Login
is wired up (`js/auth.js`, Supabase email/password) and gates the page, but
progress and notes do not yet sync to Supabase — the `progress` and `notes`
tables and their row-level-security policies exist (see `supabase/schema.sql`),
but nothing reads or writes them yet. Until the sync layer is built, this is
still a single-browser, single-device tool for progress; login only decides
who gets to see the page.

## Running it locally

Open `index.html` directly in a browser for a quick look, but the login
gate needs to fetch `js/early.js`, `js/app.js`, `js/auth.js` and `config.js`
as same-origin resources and load supabase-js from jsDelivr, so `file://`
mostly works except that a strict `Content-Security-Policy` (see below) is
only sent when the page is served over HTTP — test the real gate behaviour
by serving the folder (`python3 -m http.server`, or any static server) and
opening it over `http://`.

## Testing

- Syntax: `node --check` each file in `js/`.
- Behaviour: drive it with Playwright. Check for console errors (the Google
  Fonts request will fail in a sandbox with no network — that's expected
  and fine), confirm `document.documentElement.scrollWidth === innerWidth`
  at a 390px viewport, and confirm ticking a task persists across a reload.
- CSP: test against a server that actually sends the same headers as
  `netlify.toml` (a plain `file://` open won't enforce it), not just a bare
  static file server, so a real CSP violation doesn't slip through.
- Login: mock `window.supabase.createClient` for automated tests (sign in,
  wrong password, lockout, sign out, reload persistence). Do a final manual
  pass against the real deployment with a real account before trusting it.

## Deploying

1. Push this repo to GitHub and connect it to Netlify (or Vercel — swap
   `netlify.toml` for a `vercel.json` if you'd rather use that, and carry
   the CSP and other headers across). Free tier is enough; there's no build
   step to configure.
2. In the Supabase dashboard, turn off public sign-ups (Authentication →
   Providers → Email, or the sign-ups toggle in Authentication settings)
   once your account exists, so nobody else can register.
3. `config.js` already has the project URL and publishable key committed —
   both are safe to be public. Never put the secret/`service_role` key or a
   database password in this repo, in `config.js`, or anywhere else in the
   page; nothing here needs them.

## Adding or removing a user

Done from the Supabase dashboard (Authentication → Users), not from this
repo or by asking an AI session with Supabase access to do it — user
creation is intentionally outside what this project's tooling is allowed to
do. Invite or add the user there, then have them sign in with the login
card.

## Backing up

- **Progress**: use the footer's Export progress button to copy the current
  browser's progress as JSON; Import progress restores it (merges with, and
  does not replace, what's already there).
- **Database**: the Supabase dashboard offers project backups/exports (see
  Database → Backups for your plan's options). `supabase/schema.sql` is the
  schema, not the data, so it recreates the tables and policies but not the
  rows in them.

## Supabase project

Project ref `pdiohswlwgudikvaujen`. `supabase/schema.sql` is the current
live schema: `progress` (one row per user, a JSON blob) and `notes` (one row
per user per phase or lesson), both RLS-enabled and grant-restricted to the
`authenticated` role — `anon` has no SELECT/INSERT/UPDATE/DELETE on either
table. Changes to this schema should go in a new migration, applied via the
Supabase tooling, and then be reflected back into this file.
