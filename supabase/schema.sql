-- Schema for the Learning Supabase project (ref pdiohswlwgudikvaujen).
-- Mirrors what is currently live. Applied as two migrations:
--   1. create_progress_and_notes
--   2. harden_progress_and_notes_grants
-- "Automatically expose new tables" is OFF for this project, so table
-- grants are explicit rather than inherited from a default.

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

-- Bound note size.
alter table public.notes
  add constraint notes_body_length check (char_length(body) <= 50000);

-- Explicit CRUD grants: authenticated only, nothing for anon.
revoke select, insert, update, delete on public.progress from anon;
revoke select, insert, update, delete on public.notes from anon;
grant select, insert, update, delete on public.progress to authenticated;
grant select, insert, update, delete on public.notes to authenticated;

-- Policies restricted to the authenticated role.
create policy "own progress" on public.progress for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes" on public.notes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
