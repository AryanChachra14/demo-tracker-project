-- 42-Day Fitness Tracker: run once in Supabase → SQL Editor → New query → Run.
-- Creates one row per user per day and locks every row to the signed-in user who owns it.

create table if not exists public.tracker_days (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  day        date        not null,
  entry      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.tracker_days enable row level security;

drop policy if exists "Users manage their own days" on public.tracker_days;
create policy "Users manage their own days" on public.tracker_days
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Signed-in users only; visitors who aren't signed in get nothing.
revoke all on public.tracker_days from anon;
grant select, insert, update, delete on public.tracker_days to authenticated;
