
-- Daily wrap (one per date)
CREATE TABLE public.news_daily_wrap (
  wrap_date date PRIMARY KEY,
  summary jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_daily_wrap ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_daily_wrap public read" ON public.news_daily_wrap FOR SELECT USING (true);

-- Thesis cache
CREATE TABLE public.news_thesis_cache (
  scope_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_thesis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_thesis_cache public read" ON public.news_thesis_cache FOR SELECT USING (true);

-- Contradiction clusters
CREATE TABLE public.news_contradiction_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  headline_urls text[] NOT NULL DEFAULT '{}',
  stance_variance numeric NOT NULL DEFAULT 0,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_contradiction_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_contradiction_clusters public read" ON public.news_contradiction_clusters FOR SELECT USING (true);
CREATE INDEX idx_contradictions_recent ON public.news_contradiction_clusters (created_at DESC);

-- Earnings cache
CREATE TABLE public.news_earnings_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  period text NOT NULL,
  source text,
  url text,
  transcript_summary jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticker, period)
);
ALTER TABLE public.news_earnings_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_earnings_cache public read" ON public.news_earnings_cache FOR SELECT USING (true);
CREATE INDEX idx_earnings_ticker ON public.news_earnings_cache (ticker, fetched_at DESC);

-- Q&A log (per user)
CREATE TABLE public.news_qa_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  headline_url text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_qa_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_log select own" ON public.news_qa_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "qa_log insert own" ON public.news_qa_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_qa_log_user ON public.news_qa_log (user_id, created_at DESC);
