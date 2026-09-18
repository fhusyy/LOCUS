create table if not exists public.uniflow_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  profile_data jsonb,
  target_id text,
  completed_tasks jsonb not null default '[]'::jsonb,
  shortlist jsonb not null default '[]'::jsonb,
  applications jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.uniflow_profiles enable row level security;

drop policy if exists "Users can read their own UniFlow profile" on public.uniflow_profiles;
create policy "Users can read their own UniFlow profile"
  on public.uniflow_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own UniFlow profile" on public.uniflow_profiles;
create policy "Users can insert their own UniFlow profile"
  on public.uniflow_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own UniFlow profile" on public.uniflow_profiles;
create policy "Users can update their own UniFlow profile"
  on public.uniflow_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
