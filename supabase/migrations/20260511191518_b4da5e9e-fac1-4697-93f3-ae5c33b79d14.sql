-- News v3: caches for X/Truth and ACLED geo events

CREATE TABLE IF NOT EXISTS public.news_x_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_x_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_x_cache public read"
  ON public.news_x_cache FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_news_x_cache_fetched ON public.news_x_cache (fetched_at DESC);

CREATE TABLE IF NOT EXISTS public.news_geo_events (
  id text NOT NULL PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  event_type text NOT NULL,
  headline text NOT NULL,
  source text,
  country text,
  fatalities integer NOT NULL DEFAULT 0,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.news_geo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_geo_events public read"
  ON public.news_geo_events FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS idx_news_geo_events_occurred ON public.news_geo_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_geo_events_country ON public.news_geo_events (country);