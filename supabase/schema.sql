-- Live features for the portfolio. Run once in Supabase → SQL Editor.
--
-- The browser only ever READS (with the public anon key). Every write goes
-- through the `submit` Edge Function, which validates, rate-limits and uses
-- the service-role key. So anon gets SELECT policies and nothing else.
-- No personal data: just a display name / nickname and the text or score.

-- Guestbook ------------------------------------------------------------------
create table if not exists public.guestbook (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null check (char_length(name) between 1 and 24),
  message    text not null check (char_length(message) between 1 and 80),
  -- Notes stay hidden until you set this to true (Table Editor → guestbook).
  approved   boolean not null default false
);

alter table public.guestbook enable row level security;

drop policy if exists "approved notes are public" on public.guestbook;
create policy "approved notes are public"
  on public.guestbook for select
  to anon, authenticated
  using (approved);

create index if not exists guestbook_recent on public.guestbook (created_at desc) where approved;

-- Leaderboards ---------------------------------------------------------------
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  game       text not null check (game in ('sql', 'typing')),
  nickname   text not null check (char_length(nickname) between 1 and 20),
  value      integer not null check (value between 0 and 250),
  label      text not null check (char_length(label) <= 32)
);

alter table public.scores enable row level security;

drop policy if exists "scores are public" on public.scores;
create policy "scores are public"
  on public.scores for select
  to anon, authenticated
  using (true);

create index if not exists scores_top on public.scores (game, value desc, created_at);

-- No insert/update/delete policies on purpose: with RLS on, anon can't write.
