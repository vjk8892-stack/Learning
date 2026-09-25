# Learning

**SSIS to Fabric in 11 weeks** — a self-paced learning path for a SQL Server
/ SSIS / SSRS / Power BI developer moving to Microsoft Fabric, Spark and
Delta Lake: a route chart, six phases of tasks (50 tasks total), a 24-lesson
pilot in phase 2, stretch missions, guardrails on cost and pace, and a
Markdown notes window per phase plus a global scratchpad.

## What's here

- `index.html` — the page markup and styles. Plain HTML and CSS, no build
  step, no dependencies other than Google Fonts and (for login and sync) a
  pinned `@supabase/supabase-js` build from jsDelivr.
- `js/early.js` — a tiny blocking script that defines `window.BRAND`
  ("Learning", the single source of truth for the brand name — change it
  here, not by hunting for the string elsewhere) and sets the page title and
  meta description from it, then adds a `.js` class before first paint, so
  scroll-reveal animations start hidden with no flash. Must stay a blocking,
  non-deferred `<head>` script.
- `js/app.js` — one IIFE holding everything else: content data, progress
  state and its localStorage/cloud sync engine, notes state and its own
  sync engine, all rendering, the insights pill/panel, the account menu,
  and the notes drawer.
- `js/auth.js` — the login gate: checks the session, shows the splash,
  login card or app, wires up sign-in/sign-out and the lockout. Exposes
  `window.APP_AUTH_CLIENT` (the Supabase client) and `window.APP_AUTH_SIGNOUT`
  (the raw, ungated sign-out) for `js/app.js` to use.
- `config.js` — the Supabase project URL and publishable key (see "Login
  and privacy" below). Both are safe to be public. Loaded as a blocking
  script just before the three deferred scripts below, so `window.APP_CONFIG`
  is always set before they run.
- `netlify.toml` — Netlify config: publish the repo root, security headers
  including a Content-Security-Policy (`script-src` has no `unsafe-inline`,
  which is why every script is external — see "Architecture" below). No
  build command; there's nothing to build.
- `robots.txt` and a `noindex` meta tag — this is a private work-in-progress
  page, not something to index.
- `supabase/schema.sql` — the Postgres schema for the Learning Supabase
  project (`pdiohswlwgudikvaujen`), checked in so it's reviewable outside the
  dashboard. See "Supabase project" below.
- `CLAUDE.md` — the project handoff brief: what exists, design decisions,
  facts that expire and need rechecking, and the pending-work list. More
  detailed and more frequently updated than this file.

## Architecture

Script load order, all in `index.html`, matters and is deliberate:

1. `js/early.js` — blocking, in `<head>`, runs before first paint.
2. The page's own `<style>` block.
3. `config.js` — blocking, sets `window.APP_CONFIG`.
4. Three **deferred** scripts, in this order: the pinned
   `@supabase/supabase-js` UMD build from jsDelivr, `js/auth.js`, then
   `js/app.js`. Deferred scripts run after parsing completes, in source
   order, so each can rely on the previous having already run — `js/app.js`
   can safely read `window.APP_AUTH_CLIENT` because `js/auth.js` always runs
   first.

`js/auth.js` and the CSS decide whether `header.nav`, `main` and `footer`
are visible at all (`display:none` until the `gate-open` class is added to
`<html>`); `js/app.js` knows nothing about that and just renders into the
DOM regardless. This split exists purely to satisfy the CSP's `script-src`
(no `unsafe-inline`) — if that policy ever changes, `js/early.js` must stay
blocking and non-deferred, or the pre-paint `.js` class and title/meta
behaviour breaks.

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
only — there's nothing to sign in to in that case, and nothing syncs.

Sign-ups are meant to be switched off in the Supabase Auth settings once the
one intended user has an account, so this stays a single-user page.

## Storage keys (all in `localStorage`)

| Key | Shape | Purpose |
| --- | --- | --- |
| `ssis-to-fabric-path-v3` | `{ v:1, items: { "<id>": [1\|0, timestampMs] } }` | Current progress store. One entry per task/lesson id, with the time it last changed. |
| `ssis-to-fabric-path-v2` | `{ "<id>": 1 }` | Legacy flat format. Migrated into v3 once, automatically, the first load after v3 shipped, if v3 doesn't exist yet and v2 does. Left in place afterwards, never deleted or renamed. |
| `ssis-to-fabric-path-meta` | `{ lastSavedAt, lastChangeAt, startDate }` | `lastChangeAt` updates on every tick/untick/reset/import; `startDate` is set from the insights panel; `lastSavedAt` updates on every successful cloud save of progress. |
| `ssis-to-fabric-notes-v1` | `{ v:1, notes: { "<scope>": { body, localUpdatedAt, serverUpdatedAt, dirty } } }` | Notes store. One entry per scope (see below), each with its own dirty/sync bookkeeping so scopes sync independently. |

A task with lessons (phase 2) is "done" when all its lessons are done — this
is derived from `items` on render, never stored separately.

## Notes scopes

A note's scope is one of:

- `p0` … `p5` — the per-phase note, opened from that phase's **Notes**
  button in the section header (a sibling of the accordion toggle, so it
  never triggers the accordion).
- `lesson:<lesson-id>` — a per-lesson note (phase 2 only, since that's the
  only phase with lessons so far), opened from **Add note** under that
  lesson, or seeded automatically by the optional reflection prompt after
  ticking a lesson.
- `scratch` — the single global scratchpad, opened from the **Notes** nav
  link. The only scope with search and tag filtering, since it's the one
  place notes from every phase can be found by keyword or `#tag`.

Any other scope string is rejected — both on import and when pulling from
the cloud — so a stray or malformed row in `public.notes` can't inject an
unrecognised note into the UI.

## Current state

Progress is stored in `ssis-to-fabric-path-v3` (see table above) and syncs
to `public.progress`. Notes are stored in `ssis-to-fabric-notes-v1` and sync
to `public.notes`, one row per user per scope. Both sync engines are
local-first, debounced, and independent of each other — a failure saving
one doesn't block the other.

## Sync (progress)

Local-first: every change writes `localStorage` immediately, then debounces
(~800ms) an upsert to `public.progress`, retrying with exponential backoff
on failure (2s, doubling, capped at 60s). On sign-in, on the tab regaining
focus, and when the browser comes back online, the page pulls the cloud row
and merges it into local progress item by item — whichever side has the
later per-item timestamp wins — then pushes the merged result back, so both
sides converge. The first time you sign in on a fresh device with an empty
cloud row, this same merge step just uploads your local progress as-is,
since there's nothing to merge from.

**Signing out waits for it.** If a save is in flight, both the footer's Sign
out button and the account menu's Sign out / Sign out and clear this device
wait for it to finish (up to 8 seconds) before doing anything. If the result
is unsynced — the save failed, you're offline, or there's a change that
hasn't reached the cloud yet (progress or notes) — a dialog appears with
three choices: Export progress (opens the export dialog, doesn't sign you
out), Sign out anyway, or Cancel.

**Clear-device only wipes this device.** "Sign out and clear this device"
removes `ssis-to-fabric-path-v2`, `-v3`, `-meta` and `ssis-to-fabric-notes-v1`
from `localStorage` — never `public.progress` or `public.notes` themselves.
It goes through the same unsynced-change warning as a plain sign-out first,
so nothing is wiped while a change hasn't reached the cloud yet. Because it
only clears the device, not the account, signing back in afterwards pulls
your progress and notes straight back down from Supabase — that's expected,
not a bug: use it to clear a shared or public computer, not to delete your
data.

## Notes: sync and conflicts

Each scope has its own debounce/retry/dirty-flag bookkeeping, so one scope's
save failing doesn't hold up another's. The same pull-on-sign-in/
focus/online triggers used for progress also pull notes, one row per scope,
and merge per scope:

- If the local copy of a scope isn't dirty (no unsynced local edit), a newer
  remote row is adopted silently — same "latest wins" rule as progress.
- If the local copy **is** dirty and the remote row is also newer than what
  this device last saw, that's a genuine conflict: neither side is
  overwritten automatically. A dialog opens (only when you have that scope's
  note open, and reopens if you return to it) showing both versions with
  their IST timestamps, offering **Keep mine**, **Use theirs**, or **Copy
  mine to clipboard** (which copies your version, then adopts theirs — so
  nothing is lost, it's just left on the clipboard instead of merged
  in-page). There's no Escape shortcut for this one; you have to make an
  explicit choice.
- An empty note body deletes the row in `public.notes` on next sync rather
  than storing an empty string.

The notes drawer (a right-hand panel on screens 900px and wider, a bottom
sheet below that) is a proper dialog: focus-trapped, closes on `Escape` or
an outside click, and returns focus to whatever opened it. A small "i"
button at the top of the drawer opens a popover with the Markdown reference
(headings, lists, bold/italic, inline code, fenced code blocks, links,
`#tags`) instead of that reference sitting permanently in the editor.
Rendering is deliberately conservative: raw text is HTML-escaped first, and
only then are Markdown constructs turned into real tags — link targets are
restricted to `https://`, `http://` and `mailto:`, so a `javascript:` link or
a raw `<script>`/`<img onerror>` in a note can never execute; they render as
inert text. A `beforeunload` guard warns before leaving the page while any
note save is still pending. Notes export as grouped Markdown or as JSON
(both from the account menu, alongside progress export/import); JSON import
is validated against the known scope patterns above before anything is
written.

## Insights and account (top-right of the nav)

- **Insights pill**: the progress ring, percentage, a status dot and a
  saving-status line, time always shown in IST regardless of the visitor's
  own device time zone. In local-only mode (no login configured) it reads
  "Saved on this device · &lt;time&gt;" with a grey dot; once signed in it
  reflects the real combined sync state (folding in both progress and notes)
  — "Saved &lt;time&gt;" (a teal dot), "Saving…" (gold), "Offline · saved on
  this device" (grey) or "Could not save to the cloud · retrying" (red).
  Collapses to just the ring and dot at 900px and narrower. Click it to open
  a panel (a popover on wide screens, a bottom sheet at 900px and narrower)
  with completion counts, lessons done, an estimated hours-done figure
  (explicitly labelled an estimate), a thin bar per phase, the current phase
  and next task with an "Open it" button, the saving status with last-saved
  and last-change times, a note count and last-edited time once you have at
  least one note, and an optional start date that shows "Week N of 11" and a
  rough planned-vs-done hours comparison.
- **Account circle**: only visible when signed in, shows the first letter of
  your email. Its menu has your email, Export/Import progress, Export notes
  (Markdown or JSON) and Import notes, Sign out, and **Sign out and clear
  this device** (see "Sync" above for exactly what that wipes). Both sign-out
  options wait for a pending save — progress or notes — and warn before
  proceeding if anything is unsynced.
- Every one of these (insights panel, account menu, notes drawer, the
  conflict dialog) is a proper dialog: `Escape` closes it (except the
  conflict dialog, deliberately), clicking outside closes it, focus is
  trapped while open, and focus returns to the control that opened it.

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
  at both 390px and 1890px viewports, and confirm ticking a task persists
  across a reload.
- CSP: test against a server that actually sends the same headers as
  `netlify.toml` (a plain `file://` open won't enforce it), not just a bare
  static file server, so a real CSP violation doesn't slip through.
- Login: mock `window.supabase.createClient` for automated tests (sign in,
  wrong password, lockout, sign out, reload persistence).
- Sync: the mock needs `.from("progress")` (`select().eq().maybeSingle()`,
  `.upsert()`) and `.from("notes")` (`select().eq()`, `.upsert()`,
  `.delete().eq().eq()`) implemented, backed by something two separate
  browser contexts can both reach (a small fake REST endpoint on the same
  test server works well) — that's what makes it possible to actually verify
  two "browsers" converge to the same progress and notes, not just that each
  one works in isolation. Cover: a normal save, offline → online, a forced
  failure retrying with backoff, sign-out waiting for and surviving a save,
  sign-out blocked by the warning dialog on a failed save, notes autosave,
  the conflict dialog (all three resolutions), and the two-context merge
  itself for both progress and notes.
- XSS: feed a note body containing `<img src=x onerror=alert(1)>`, a
  `<script>` tag and a `[link](javascript:alert(1))` and confirm none of them
  become live markup or fire — they should render back as escaped text with
  no `<a href="javascript` anywhere in the output.
- Timezones: run the same scenario under `timezone_id` set to `UTC`,
  `America/New_York` and `Asia/Kolkata` and confirm the displayed time
  string is identical in all three (it should always read as IST).
- A final manual pass against the real deployment with a real account — not
  the mock — is worth doing before trusting any of the above, particularly
  for real network latency and real Supabase token refresh behaviour, which
  a mock can't reproduce.

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
4. Supabase free projects pause after 7 days of inactivity (data is kept;
   resume it from the dashboard). Use the page regularly, add a scheduled
   keep-alive, or upgrade the plan if that's a problem.
5. For password recovery to work: Supabase dashboard → Authentication →
   URL Configuration → set **Site URL** to the deployed site's origin
   (e.g. `https://your-site.netlify.app`), and add that same origin under
   **Redirect URLs**. Without this, the emailed reset link won't land back
   on the page correctly. Test it by actually requesting a reset and
   confirming the email arrives and the link works — that can't be
   verified from a dev sandbox with no outbound email or a reachable
   Supabase project.
6. For the weekly-checks workflow to run its site/data checks instead of
   skipping them, add three repository variables (Settings → Secrets and
   variables → Actions → Variables, not Secrets — these aren't sensitive):
   `SITE_URL` (the deployed origin), `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY` (the same two values already in `config.js`).

## Adding or removing a user

Done from the Supabase dashboard (Authentication → Users), not from this
repo or by asking an AI session with Supabase access to do it — user
creation is intentionally outside what this project's tooling is allowed to
do. Invite or add the user there, then have them sign in with the login
card.

**Never delete a user to fix a login problem.** `public.progress.user_id`
and `public.notes.user_id` are both `references auth.users(id) on delete
cascade` — deleting the auth user silently deletes their progress and
notes rows too, with no recovery short of a database backup. If someone is
locked out, use the dashboard's own tools instead: Authentication → Users
→ that user → **Send password recovery** (or **Reset password**,
depending on the dashboard version) sends the same reset email the page's
own "Forgot password?" link would, and the account itself, and its data,
are untouched.

## Password recovery and changing your password

- **Forgot password**: the login card has a "Forgot password?" link. It
  always shows the same message ("If an account exists for that email, a
  reset link is on its way") whether or not the email has an account, the
  same principle as the sign-in error. The email links back to the site
  with a Supabase recovery token in the URL; the page detects it
  (`PASSWORD_RECOVERY` from `onAuthStateChange`) and shows a "Set a new
  password" card instead of the login card — 12-character minimum, a
  confirm field, generic errors. Cancelling out of that card while it got
  there from an emailed link signs out the temporary recovery session and
  returns to the plain login card, rather than leaving a half-authenticated
  state open.
- **Change password** (already signed in): the same card, reachable from
  the account menu's **Change password** item. Cancelling here just closes
  the card and returns to the app, since there's a normal session to
  return to.
- **For this to work in Supabase**, Authentication → URL Configuration
  needs the Site URL set to the deployed site's origin, and that origin
  present in Redirect URLs — see the deploy checklist below.

## Backing up

- **Progress and notes**: both sync to Supabase automatically once signed
  in (see "Sync" and "Notes" above), so the cloud rows are the main backup.
  The account menu's Export progress and Export notes (Markdown or JSON)
  are still there for a manual, point-in-time copy (handy before a risky
  change, or if you don't trust the sync yet); the matching Import options
  merge into what's already there rather than replacing it.
- **Database**: the Supabase dashboard offers project backups/exports (see
  Database → Backups for your plan's options). `supabase/schema.sql` is the
  schema, not the data, so it recreates the tables and policies but not the
  rows in them.

## Supabase project

Project ref `pdiohswlwgudikvaujen`. `supabase/schema.sql` is the current
live schema: `progress` (one row per user, a JSON blob) and `notes` (one row
per user per scope, `body text` capped at 50,000 characters by a `CHECK`
constraint matching the UI's own limit), both RLS-enabled and
grant-restricted to the `authenticated` role — `anon` has no
SELECT/INSERT/UPDATE/DELETE on either table. Changes to this schema should
go in a new migration, applied via the Supabase tooling, and then be
reflected back into this file.

## What remains

See `CLAUDE.md`'s "Pending work" section for the full, current list. In
short, as of this session:

- The Phase 2 lesson code has been reviewed but never actually run against
  PySpark/Delta, or against Fabric/Databricks-specific bits.
- Lessons only exist for phase 2; phases 1, 3, 0 and 4 still need them
  (phase 5 is meant to stay links-only).
- The two-browser sync/notes tests in this repo run against a mocked
  Supabase client and a fake REST backend, not the real project — a live
  two-browser pass against the real deployment (real network latency, real
  RLS enforcement, real token refresh) hasn't been done yet.
- A contrast audit, a full keyboard/screen-reader pass, and testing on a
  real low-end phone are still outstanding.
- Nice-to-have items (confidence ratings, a study calendar, a "calm mode",
  search across lessons) are listed but not started.
