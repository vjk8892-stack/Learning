# SSIS to Fabric learning path: handoff brief

Owner: a data/BI professional (SQL Server, SSIS, SSRS, Power BI, DAX, ADF) upskilling to Microsoft Fabric, Spark and Delta.
State as of 24 September 2026. Current deliverable: `index.html` (single file, no build step, no dependencies except Google Fonts).

## What exists

A dark, space-themed learning-path page:
- Hero animation, 12-week route chart, "where you start" (translation table), "why these skills" (job-listing signals), freshness check table, 7 phases, stretch missions, guardrails.
- 57 tasks in 7 phases. **Phase 2 is a pilot with 24 lessons** (Learn, Try it, Break it, Prove it, self-test questions, copyable code). Other phases are task lists only.
- Progress is stored in `localStorage` under key `ssis-to-fabric-path-v2` (a flat object: `{ "<taskId or lessonId>": 1 }`). Task ids look like `p1-a`; lesson ids like `p2-merge-3`. A task with lessons is done when all its lessons are done (derived, never stored).
- It was also published as a claude.ai artifact. The file contains no `window.claude` calls, so it runs anywhere.

## How the file is organised (search for these markers)

- `<style>`: tokens in `:root` (dark-only; all theme selectors resolve to the same palette). Sections: deep space layers, slow arrivals (`.rv`), nav, hero, route, phases + trajectory, tasks with lessons, gutters (wide screens), reduced-motion block at the end.
- `<body>`: `#cosmos` (star layers, nebulae, planets, aura), `#rail` and `#orbit` (wide-screen gutters), `#fx` (burst canvas), then sections `#route #start #signal #fresh #path #stretch #guardrails`.
- `<script>` (one IIFE), in this order: helpers, **content data** (`P0 P1 P2 P3 P4 P5 P6`, `STRETCH`, `ROSETTA`, `SIGNALS`, `FRESH`, `COSTS`), state (`done`, `taskDone`), renderers (`renderRoute`, `renderStatic`, `renderPhases`, `lessonHTML`), refresh + interactions, `cosmos()`, `hero()`, boot.
- Lessons render lazily on first open (`ensureLesson`). Code is stored with `String.raw` (`R` tag); never put a backtick or `${` inside lesson code.
- Phase object shape: `{id,n,short,name,layer,layerName,weeks,hours,cost,tone,needs,goal,tasks[],ship,note,bridge[],links[]}`. Task: `{id,t,d,subs?}`. Lesson: `{id,t,mins,learn[],try[],expect,brk,prove[],quiz[],watch,links}`.

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

### A. Remove job-search content (do first)
- [ ] Delete phase `P6` (Launch) and remove it from the `PHASES` array, `COSTS` ("Phase 6"), route chart, hero/facts counts and hours (about 106 hours becomes about 98).
- [ ] `renderRoute`: remove the "Start applying" milestone flag. Decide whether the route is now 11 weeks (P5 ends in week 11) and update "12-week" copy in hero, nav, route section, facts and title.
- [ ] Task `p5-g` detail mentions LinkedIn and resume: reword to just sitting the exam.
- [ ] `#signal` section ("Why these skills") and its nav link and `SIGNALS` array are built from job listings. **Open question for the owner: drop it, or keep a shorter version framed as skill context.** Also fix wording in the footer and `#signal` intro that mentions job listings.
- [ ] Stored progress keys for `p6-*` become orphans; harmless, but ignore them in totals.

### B. Standalone site with login, cloud progress and notes
- [ ] Repo scaffold: `index.html`, `netlify.toml` (or `vercel.json`), `README.md`. Consider splitting CSS/JS into files if it helps maintenance; keep no-build simplicity.
- [ ] Supabase project. Schema:
  ```sql
  create table public.progress (
    user_id uuid primary key references auth.users(id) on delete cascade,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now());
  create table public.notes (
    user_id uuid not null references auth.users(id) on delete cascade,
    scope text not null,               -- 'p0'..'p5', a lesson id, or 'scratch'
    body text not null default '',
    updated_at timestamptz not null default now(),
    primary key (user_id, scope));
  alter table public.progress enable row level security;
  alter table public.notes enable row level security;
  create policy "own progress" on public.progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  ```
  RLS must stay on. The anon key is public by design; the service key must never be in the page.
- [ ] Auth UI: sign up, sign in, sign out, password reset, email confirmation. Load `@supabase/supabase-js` as a pinned UMD script from jsDelivr.
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
