CREATE TABLE IF NOT EXISTS public.econ_calendar_events (
  id uuid primary key default gen_random_uuid(),
  source text,
  kind text not null check (kind in ('econ','earnings','cb','geo')),
  ts timestamptz not null,
  country text,
  ticker text,
  label text not null,
  importance int not null default 1,
  prior numeric,
  forecast numeric,
  actual numeric,
  unit text,
  extra jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_econ_cal_ts_imp ON public.econ_calendar_events (ts, importance DESC);
CREATE INDEX IF NOT EXISTS idx_econ_cal_kind ON public.econ_calendar_events (kind);
CREATE INDEX IF NOT EXISTS idx_econ_cal_ticker ON public.econ_calendar_events (ticker);
ALTER TABLE public.econ_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "econ_calendar public read" ON public.econ_calendar_events FOR SELECT USING (true);