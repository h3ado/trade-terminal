create table public.option_strategy_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  name text not null,
  legs jsonb not null,
  stats jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.option_strategy_templates enable row level security;

create policy "users manage own templates"
  on public.option_strategy_templates
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger set_option_strategy_templates_updated_at
before update on public.option_strategy_templates
for each row execute function public.update_updated_at_column();

create index option_strategy_templates_user_idx on public.option_strategy_templates(user_id, created_at desc);