
create table public.news_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  scope text not null check (scope in ('global','country','ticker','keyword')),
  value text not null default '',
  filters jsonb not null default '{}'::jsonb,
  alert_enabled boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.news_saved_searches enable row level security;
create policy "saved searches select own" on public.news_saved_searches for select using (auth.uid() = user_id);
create policy "saved searches insert own" on public.news_saved_searches for insert with check (auth.uid() = user_id);
create policy "saved searches update own" on public.news_saved_searches for update using (auth.uid() = user_id);
create policy "saved searches delete own" on public.news_saved_searches for delete using (auth.uid() = user_id);

create table public.news_brief_log (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  scope text not null,
  value text not null default '',
  created_at timestamptz not null default now()
);
alter table public.news_brief_log enable row level security;
create policy "brief log select own" on public.news_brief_log for select using (auth.uid() = user_id);
create policy "brief log insert own" on public.news_brief_log for insert with check (auth.uid() = user_id);
create index news_brief_log_user_time on public.news_brief_log (user_id, created_at desc);
