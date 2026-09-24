# SSIS to Fabric learning path: handoff brief

Owner: a data/BI professional (SQL Server, SSIS, SSRS, Power BI, DAX, ADF) upskilling to Microsoft Fabric, Spark and Delta.
State as of 24 September 2026. Current deliverable: `index.html` plus `config.js`, `js/early.js`, `js/auth.js` and `js/app.js` (plain HTML/CSS/JS, no build step, no dependency other than Google Fonts and a pinned `@supabase/supabase-js` from jsDelivr).

## What exists

A dark, space-themed learning-path page, now behind a login gate:
- Hero animation, 11-week route chart, "where you start" (translation table), freshness check table, 6 phases, stretch missions, guardrails.
- 50 tasks in 6 phases. **Phase 2 is a pilot with 24 lessons** (Learn, Try it, Break it, Prove it, self-test questions, copyable code). Other phases are task lists only.
- **Login gate** (`js/auth.js`): a full-page splash checks the Supabase session, then shows either a login card (email/password) or the app — the app's markup (`header.nav`, `main`, `footer`) is `display:none` by default in CSS and only revealed once JS confirms a session or local-only mode, so there's no flash of content before login. A cosmetic 60-second lockout follows 5 failed sign-in attempts (client-side counter, not enforced server-side). If `config.js` has no URL/key, the gate is skipped entirely and a "local-only mode" banner shows instead — this is a lock screen only: lesson text is still in the page source regardless of login state; the real protection is Row Level Security on the Supabase tables. See README "Login and privacy".
- Progress is stored in `localStorage` under key `ssis-to-fabric-path-v2` (a flat object: `{ "<taskId or lessonId>": 1 }`). Task ids look like `p1-a`; lesson ids like `p2-merge-3`. A task with lessons is done when all its lessons are done (derived, never stored). Not yet synced to Supabase (that's the next pending item).
- Export/import progress as JSON from the footer (clipboard, with a select-and-copy fallback; import is validated against known task/lesson ids, unrecognised ids are skipped, valid ones are merged into existing progress rather than replacing it).
- No job-search content: it was deliberately removed (see "Pending work" below for what changed).
- It was also published as a claude.ai artifact. The page has no `window.claude` calls, so it runs anywhere (though the login gate now needs a reachable Supabase project, or `config.js` left empty, to behave sensibly).

## How the file is organised (search for these markers)

- `index.html` `<head>`: loads `js/early.js` synchronously (adds the `.js` class before first paint, so `.rv` reveal animations start hidden) then the page's own `<style>` block (dark-only tokens in `:root`; sections: deep space layers, slow arrivals (`.rv`), nav, hero, route, phases + trajectory, tasks with lessons, import/export panel, login gate, gutters (wide screens), reduced-motion block at the end).
- `<body>`: `#gate` (splash + login card, `position:fixed`, highest z-index) right at the top so it overlays everything immediately, then `#cosmos` (star layers, nebulae, planets, aura), `#rail` and `#orbit` (wide-screen gutters), `#fx` (burst canvas), `#localBanner` (local-only mode notice, normal flow, sits above the nav when shown), then `header.nav`, `main` with sections `#route #start #fresh #path #stretch #guardrails`, footer (reset/export/import/sign out), and the `#ioPanel` export/import dialog. `header.nav`, `main` and `footer` are hidden by CSS (`html:not(.gate-open) ...{display:none}`) until `js/auth.js` adds the `gate-open` class to `<html>`.
- End of body, in dependency order: `config.js` (blocking, sets `window.APP_CONFIG`), then three **deferred** scripts in this order — the pinned `@supabase/supabase-js` UMD build from jsDelivr, `js/auth.js`, `js/app.js`. All deferred scripts run after parsing completes, in source order, so each one can rely on the previous having already run.
- `js/auth.js`: reads `window.APP_CONFIG`; if missing/empty or if `window.supabase` failed to load, falls open to local-only mode (banner shown, gate skipped, no login). Otherwise creates the Supabase client (exposed as `window.APP_AUTH_CLIENT` for the sync layer to use later), checks `getSession()`, shows the login card if there's no session, handles `signInWithPassword`, the lockout counter, `signOut`, and `onAuthStateChange`.
- `js/app.js` (one IIFE), in this order: helpers, **content data** (`P0 P1 P2 P3 P4 P5`, `STRETCH`, `ROSETTA`, `FRESH`, `COSTS`), state (`done`, `taskDone`, `KNOWN_IDS`), renderers (`renderRoute`, `renderStatic`, `renderPhases`, `lessonHTML`), refresh + interactions (including `bindIO` for export/import), `cosmos()`, `hero()`, boot. It knows nothing about auth — it always renders into the DOM; `js/auth.js` and the CSS decide whether that DOM is visible.
- Lessons render lazily on first open (`ensureLesson`). Code is stored with `String.raw` (`R` tag); never put a backtick or `${` inside lesson code.
- Phase object shape: `{id,n,short,name,layer,layerName,weeks,hours,cost,tone,needs,goal,tasks[],ship,note,bridge[],links[]}`. Task: `{id,t,d,subs?}`. Lesson: `{id,t,mins,learn[],try[],expect,brk,prove[],quiz[],watch,links}`.
- The `js/early.js` / `js/app.js` split (and now `js/auth.js`) exists only to satisfy the Content-Security-Policy in `netlify.toml` (`script-src 'self' https://cdn.jsdelivr.net`, no `'unsafe-inline'`). If the CSP ever needs to change, keep in mind `early.js` must stay a blocking, non-deferred `<head>` script or the `.js`-class-before-paint behaviour breaks; `config.js` must run before the deferred scripts, which it does by being a blocking script placed just before them.

## Design decisions worth keeping

- Layer colours mean something: bronze = foundations, silver = core engineering, gold = production and proof. Phase markers are planets; the glowing probe follows scroll.
- Performance work is done: stars are pre-rendered tiles animated by CSS, scroll work is event-driven, no `backdrop-filter`, `content-visibility:auto` on lower sections, lessons lazy-rendered. Measured (headless Chromium, 1890px): idle JS about 6 ms/s, scroll JS about 9 ms/s, about 1,550 DOM nodes. Do not reintroduce per-frame full-canvas redraws or a root CSS variable updated on scroll.
- `body{isolation:isolate}` is required. Without it the `#cosmos` layer paints under the body background and the sides look plain black (this was a real bug).
- Respects `prefers-reduced-motion` (CSS kills animations, JS avoids loops).
- Copy style: plain sentences, no em dashes, UK spelling in prose, no filler.

## Facts verified on 24 September 2026 (recheck when they expire)

- Fabric Runtime 2.0 is GA (Spark 4.1, Delta 4.2, Python 3.13). It becomes the default for new workspaces in **late September 2026**. Delta 4.x-specific features are experimental and Spark-only. Runtime 1.3 = Spark 3.5, Delta 3.2. V-Order is off by default in new workspaces.
- Databricks Free Edition (docs updated 11 Sep 2026): serverless-only, no custom compute, restricted outbound internet, Unity Catalog preconfigured (`workspace.default`), one small SQL warehouse.
- DP-600: current outline 21 Jul 2026; **new English outline effective 19 Oct 2026** (minor change to "query and analyze data"). DP-700 blueprint 21 Jul 2026 (Apache Airflow workspace settings replaced Dataflows Gen2 settings). PL-300 outline 20 Apr 2026. DP-203 retired; DP-700 is its successor. Recommended order: PL-300, DP-600, DP-700.
- Fabric trial: 60 days, provisioned as F4 or F64 depending on tenant.
- ADF to Fabric: "Migrate to Fabric (Preview)" assistant and factory mounting exist; SSIS integration runtimes have no Fabric equivalent (run in ADF, call from a Fabric pipeline, or rebuild); self-hosted IR becomes an on-premises data gateway; mapping data flows need rebuilding; global parameters become variable libraries.
- Sources: learn.microsoft.com/en-us/fabric/data-engineering/runtime-2-0, learn.microsoft.com/en-us/fabric/fundamentals/fabric-trial, learn.microsoft.com/en-us/fabric/data-factory/migrate-planning-azure-data-factory, docs.databricks.com/aws/en/getting-started/free-edition-limitations, learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600 (also dp-700, pl-300).

## Decisions already made by the owner

1. **Exclude everything about job search for now.** See "Remove job-search content" below.
2. Move to a standalone website (not only the claude.ai artifact): always on, password login, short name, saved progress, a notes window per phase.
3. Recommended stack: static host (Netlify or Vercel; both free and always on) plus **Supabase** for email/password login and data. Note: Netlify's site-wide password and Vercel's production password protection are paid, so login is built into the app and protects progress and notes, not the public lesson pages. Cloudflare Pages + Cloudflare Access (free up to 50 users, email code or Google login) is the alternative if the whole site should be hidden.
4. Name candidates for `name.netlify.app`: `fab12`, `fabpath`, `lakepath`, `medal`, `s2fab` (add initials if taken). Availability is unchecked.

## Pending work

### A. Remove job-search content (do first) — done
- [x] Delete phase `P6` (Launch) and remove it from the `PHASES` array, `COSTS` ("Phase 6"), route chart, hero/facts counts and hours (about 106 hours becomes about 98).
- [x] `renderRoute`: remove the "Start applying" milestone flag. The route is now 11 weeks (P5 ends in week 11); updated "12-week" copy in hero, nav, route section, facts and title, plus the 12-column route grid CSS/JS.
- [x] Task `p5-g` detail mentions LinkedIn and resume: reworded to just sitting the exam.
- [x] `#signal` section ("Why these skills"), its nav link, the `SIGNALS` array and its scrollspy entry are removed (owner chose to drop it, not keep a shorter version). Fixed wording in the footer and the "This path adds" card that mentioned job listings. Also reworded the two "update your resume" strings left over in the all-phases-complete messages (`nextUp` panel and the final toast).
- [x] Stored progress keys for `p6-*` are harmless orphans; `TOTAL`/`taskDone` are derived from `PHASES`, which no longer includes P6, so they're already ignored in totals with no code change needed.

Verified: `node --check` on the extracted script passes; headless Chromium run shows no console errors, 6 phases, 98 total hours, 24 lessons, route ends at W11, no `#signal` in the DOM, progress survives reload, and no horizontal overflow at 390px.

### B. Standalone site with login, cloud progress and notes
- [x] Repo scaffold: `index.html` (already existed), `netlify.toml` (publish root, basic security headers, no build step) and `README.md` added. CSS stayed inline (`style-src` allows `'unsafe-inline'`); the two inline `<script>` blocks were later moved to `js/early.js` and `js/app.js` because the CSP needs `script-src` without `'unsafe-inline'` (see below).
- [x] Hardening pass (2026-09-24, second session): `<meta name="robots" content="noindex">` plus a root `robots.txt` (`Disallow: /`) since this is a private in-progress tool, not something to index. `Content-Security-Policy` added to `netlify.toml`: `default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' blob: data:; connect-src 'self' https://pdiohswlwgudikvaujen.supabase.co`. That required moving both inline `<script>` blocks out to `js/early.js` and `js/app.js` (see "How the file is organised" above) since `script-src` has no `'unsafe-inline'`. Retested against a local server that actually sends these headers (not just `file://`): no console or CSP-violation errors, no horizontal overflow at 390px, `#rail`/`#orbit` both visible at 1890px, progress still persists across reload. Export progress / Import progress buttons added to the footer: export copies the current `done` object as JSON to the clipboard (falls back to a visible, pre-selected textarea if the clipboard API is unavailable or blocked); import parses pasted JSON, keeps only ids present in `KNOWN_IDS` (built from `PHASES` task and lesson ids), merges them into existing progress rather than replacing it, and reports counts imported/skipped. Confirmed unknown ids (including an XSS-attempt string used as an id) are silently skipped and never reach `innerHTML`.
- [x] Supabase project. Project ref `pdiohswlwgudikvaujen`, URL `https://pdiohswlwgudikvaujen.supabase.co`. Schema applied as two migrations, `create_progress_and_notes` then `harden_progress_and_notes_grants`; the live DDL is mirrored in `supabase/schema.sql`. "Automatically expose new tables" is OFF for this project, so table grants are explicit, not inherited.
  - `public.progress` (`user_id` pk/fk to `auth.users`, `data jsonb`, `updated_at`) and `public.notes` (`user_id, scope` pk, `user_id` fk to `auth.users`, `body text`, `updated_at`) as specified, both with RLS enabled.
  - `notes.body` has a `check (char_length(body) <= 50000)` constraint.
  - Grants confirmed via `information_schema.role_table_grants`: `authenticated` has exactly SELECT, INSERT, UPDATE, DELETE on both tables; `anon` has none of those four (explicitly revoked, in addition to never having been granted).
  - Both policies (`own progress`, `own notes`) are `FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` — confirmed via `pg_policies` showing `roles: {authenticated}`, not `{public}`.
  - `get_advisors` (security) shows no findings on these tables. It does show a pre-existing `rls_auto_enable()` function warning (unrelated, not touched) and a project-level "leaked password protection disabled" warning — that's an auth setting, out of scope for this session (auth settings were explicitly off-limits) and left for the owner to enable if wanted.
  - The anon/publishable key is public by design and can go in the page; the service key must never be in the page and was not requested or used here.
    - Legacy anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaW9oc3dsd2d1ZGlrdmF1amVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDg5MTQsImV4cCI6MjEwNTgyNDkxNH0.A-vzg9S8H4x_r6jAHhEzwLxaSe-Pm7n7z1i3Qc7YGX0`
    - Modern publishable key: `sb_publishable_KbUBBi1y9KMSEg0Jn9attA_S4oaWg6I`
- [x] Login gate built as `js/auth.js` + `config.js`, 2026-09-24. Sign in (email/password, `signInWithPassword`) and sign out, a neutral splash while the session is checked, then login card or app with no flash of app content, session persists across reload (supabase-js's own `persistSession`), cosmetic 60-second lockout after 5 failed attempts, generic error message that doesn't reveal whether the email exists, password show/hide, Enter submits, focus starts on the email field. Deliberately **no** sign-up, password-reset or email-confirmation UI: the owner is switching sign-ups off in the Supabase dashboard once their one account exists, so there's exactly one user and nothing to self-serve — add that UI later only if that assumption changes. `@supabase/supabase-js` loaded from jsDelivr pinned to an exact version (`2.117.1`, the latest on npm as of this session), `defer`, alongside `config.js`/`js/auth.js`/`js/app.js` also `defer` so they run in that order after `config.js` (a blocking script) has already set `window.APP_CONFIG`. Tested with `window.supabase.createClient` mocked (sign in success/failure, lockout, sign out, reload persistence, local-only fallback when `config.js` is empty or the CDN script 404s) against a local server sending the real `netlify.toml` headers, so the CSP was genuinely exercised, not just assumed: zero console/CSP errors in every scenario. Could not reach `cdn.jsdelivr.net` from this sandbox (network policy blocks it) to fetch the real file, so the exact CDN URL is unverified against production — that still needs a live check.
- [ ] Sync layer behind one small adapter (`load()`, `save()`), local-first: write to `localStorage` immediately, debounce upserts to Supabase, show a "Saved" indicator, compare `updated_at` and warn if another device changed the data (last-writer-wins otherwise).
- [ ] One-time import of existing `localStorage` progress on first login.
- [ ] Notes window per phase: side drawer on wide screens, bottom sheet on phones, opened from a "Notes" button on each phase; plus a global scratchpad. Autosave, light Markdown (headings, lists, code fences), tags (question, gotcha, win), search across notes, export/import (Markdown and JSON). Optional two-line reflection prompt when a lesson is ticked. Keep each note small.
- [ ] Do not store secrets or client data in notes; add a visible reminder.

### C. Content
- [ ] **Run the Phase 2 lesson code** against local PySpark + Delta (`pip install pyspark delta-spark`) and fix anything that breaks. It has been reviewed but never executed. Platform-specific bits (Fabric `%%sql`, Databricks `dbutils`, Auto Loader, volumes) still need one manual run on each platform.
- [ ] Add lessons for phase 3 (migration, the strongest portfolio piece) then phase 1, then lighter ones for phases 0 and 4. Phase 5: link to Microsoft outlines and practice assessments instead of writing lessons.
- [ ] Add a "last verified" date to each lesson.
- [ ] Recheck after 19 Oct 2026 (DP-600 outline) and after Runtime 2.0 becomes the default; update `FRESH`, P5 and the runtime lesson.

### D. Nice to have (owner has not asked yet)
- [ ] Start date and pace tracker (week number, hours done vs planned).
- [ ] Confidence rating per lesson and a "revisit" list; a short daily review of missed self-test questions.
- [ ] Study-day calendar and per-lesson timer (no punishing streaks).
- [ ] "Calm mode" that dims the space effects when reading code.
- [ ] Search across lessons, keyboard shortcuts, print view.

### E. Quality
- [ ] Contrast audit: small grey text (`--dim`, rail labels, route note) is probably below WCAG AA.
- [ ] Keyboard and screen-reader pass (accordions use buttons with `aria-expanded`; verify focus order and the lazy lesson content).
- [ ] Test on a real low-end phone; run Lighthouse.
- [ ] Minor visual: on very wide screens the hero "Gold" label overlaps the ringed planet.
- [ ] Progress from the first version (`ssis-to-fabric-path-v1`) was never migrated; task ids changed.

## Deploy checklist
1. Push the repo to GitHub; connect Netlify (or Vercel). Free tiers are enough.
2. Pick the name; confirm the subdomain is free.
3. Create the Supabase project, run the SQL, add the URL and anon key to the page config.
4. Supabase free projects pause after 7 days of inactivity (data kept; resume from the dashboard). Use it regularly, add a scheduled keep-alive, or upgrade.
5. Optional: buy a short custom domain and point it at the host.

## How to test locally
- Syntax: extract the `<script>` body and run `node --check`.
- Behaviour: Playwright (Python or Node) against `file:///.../index.html`. Useful checks: no console errors (ignore the blocked Google Fonts request in sandboxes), `document.documentElement.scrollWidth === viewport width` on a 390px viewport, open a lesson, tick it, confirm the task becomes done and the progress survives a reload.
- Measure JS cost by wrapping `requestAnimationFrame` and summing callback time while idling and scrolling.
