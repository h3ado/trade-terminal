create table if not exists public.option_alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  ticker text,
  rule_type text not null,
  params jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.option_alert_rules enable row level security;

create policy "alert rules select own" on public.option_alert_rules for select using (auth.uid() = user_id);
create policy "alert rules insert own" on public.option_alert_rules for insert with check (auth.uid() = user_id);
create policy "alert rules update own" on public.option_alert_rules for update using (auth.uid() = user_id);
create policy "alert rules delete own" on public.option_alert_rules for delete using (auth.uid() = user_id);

create trigger trg_alert_rules_updated_at
before update on public.option_alert_rules
for each row execute function public.update_updated_at_column();