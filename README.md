# Learning

**SSIS to Fabric in 11 weeks** — a self-paced learning path for a SQL Server
/ SSIS / SSRS / Power BI developer moving to Microsoft Fabric, Spark and
Delta Lake: a route chart, six phases of tasks (50 tasks total), a 24-lesson
pilot in phase 2, stretch missions and guardrails on cost and pace.

## What's here

- `index.html` — the page markup and styles. Plain HTML and CSS, no build
  step, no dependencies other than Google Fonts and (for login) a pinned
  `@supabase/supabase-js` build from jsDelivr.
- `js/early.js` — a tiny blocking script that defines `window.BRAND`
  ("Learning", the single source of truth for the brand name — change it
  here, not by hunting for the string elsewhere) and sets the page title and
  meta description from it, then adds a `.js` class before first paint, so
  scroll-reveal animations start hidden with no flash.
- `js/app.js` — the page's own logic: content, rendering, progress
  (including the local-first sync engine — see "Sync" below), export/import,
  the insights pill/panel and account menu.
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
`ssis-to-fabric-path-v3`: `{ v:1, items: { "<id>": [1 or 0, timestampMs] } }`
— one entry per task/lesson id with the time it last changed. The older flat
`ssis-to-fabric-path-v2` (`{ "<id>": 1 }`) is migrated into v3 automatically
the first time the page loads after this update, if found; it's left alone
afterwards, not deleted. A second key, `ssis-to-fabric-path-meta`, holds
`{ lastSavedAt, lastChangeAt, startDate }` — `lastChangeAt` updates on every
tick/untick/reset/import, `startDate` is set from the insights panel's "Set
start date" control, and `lastSavedAt` updates on every successful cloud
save. Login is wired up (`js/auth.js`, Supabase email/password) and gates
the page; progress now syncs to `public.progress` too (see "Sync" below).
Notes don't sync yet — that's the next phase.

## Sync

Local-first: every change writes `localStorage` immediately, then debounces
(~800ms) an upsert to `public.progress`, retrying with exponential backoff
on failure. On sign-in, on the tab regaining focus, and when the browser
comes back online, the page pulls the cloud row and merges it into local
progress item by item — whichever side has the later timestamp for a given
task wins — then pushes the merged result back, so both sides converge. The
first time you sign in on a fresh device with an empty cloud row, this same
merge step just uploads your local progress as-is, since there's nothing to
merge from. None of this needs the notes drawer or anything else from later
phases; it works standalone.

**Signing out waits for it.** If a save is in flight, both the footer's Sign
out button and the account menu's Sign out / Sign out and clear this device
wait for it to finish (up to 8 seconds) before doing anything. If the result
is unsynced — the save failed, you're offline, or there's a change that
hasn't reached the cloud yet — a dialog appears with three choices: Export
progress (opens the export dialog, doesn't sign you out), Sign out anyway,
or Cancel. Clear-device in particular never touches `localStorage` until
you've gone through this and chosen to proceed, so an unsynced change is
never silently lost to a device wipe.

## Insights and account (top-right of the nav)

- **Insights pill**: the progress ring, percentage, a status dot and a
  saving-status line, time always shown in IST regardless of the visitor's
  own device time zone. In local-only mode (no login configured) it reads
  "Saved on this device · &lt;time&gt;" with a grey dot; once signed in it
  reflects the real sync state — "Saved &lt;time&gt;" (a teal dot), "Saving…"
  (gold), "Offline · saved on this device" (grey) or "Could not save to the
  cloud · retrying" (red) — see "Sync" above. Collapses to just the ring and
  dot at 900px and narrower. Click it to open a panel (a popover on wide
  screens, a bottom sheet at 900px and narrower) with completion counts,
  lessons done, an estimated hours-done figure (explicitly labelled an
  estimate — it's tasks-done × phase-hours ÷ tasks-in-phase, summed), a thin
  bar per phase, the current phase and next task with an "Open it" button,
  the saving status with last-saved and last-change times, and an optional
  start date that shows "Week N of 11" and a rough planned-vs-done hours
  comparison.
- **Account circle**: only visible when signed in, shows the first letter of
  your email. Its menu has your email, Export/Import progress (the same
  feature as the footer buttons, just reachable from here too), Sign out,
  and **Sign out and clear this device** — which also wipes the
  `ssis-to-fabric-path-v2`, `-v3` and `-meta` `localStorage` keys, for a
  shared or public computer. Both sign-out options wait for a pending save
  and warn before proceeding if anything is unsynced — see "Sync" above.
  The footer's own Sign out button still works independently (same guard).
- Both are proper dialogs: `Escape` closes, clicking outside closes, focus
  is trapped while open (Tab wraps within the insights panel; arrow keys
  move between the account menu's items) and returns to the button that
  opened it on close.

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
- Sync: the mock's `.from("progress")` needs `.select().eq().maybeSingle()`
  and `.upsert()` implemented too, backed by something two separate browser
  contexts can both reach (a small fake REST endpoint on the same test
  server works well) — that's what makes it possible to actually verify two
  "browsers" converge to the same progress, not just that each one works in
  isolation. Cover: a normal save, offline → online, a forced failure
  retrying with backoff, sign-out waiting for and surviving a save, sign-out
  blocked by the warning dialog on a failed save, and the two-context merge
  itself. As with login, a final manual two-browser pass against the real
  deployment is worth doing before trusting it (see `CLAUDE.md`'s pending
  work for the exact checklist from the most recent session).

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

- **Progress**: syncs to Supabase automatically once signed in (see "Sync"
  above), so the cloud row is the main backup. The footer's Export progress
  button is still there for a manual, point-in-time copy as JSON (handy
  before a risky change, or if you don't trust the sync yet); Import
  progress restores it (merges with, and does not replace, what's already
  there).
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
