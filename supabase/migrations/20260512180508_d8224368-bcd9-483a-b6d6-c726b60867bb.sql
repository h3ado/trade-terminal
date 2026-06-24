-- News v5: squawk audio queue + cb policy doc cache
CREATE TABLE public.news_audio_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline_url text NOT NULL,
  title text NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  domain text,
  created_at timestamptz NOT NULL DEFAULT now(),
  played boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_news_audio_queue_created ON public.news_audio_queue(created_at DESC);
ALTER TABLE public.news_audio_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audio_queue public read" ON public.news_audio_queue FOR SELECT USING (true);

CREATE TABLE public.news_cb_doc_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  doc_url text NOT NULL UNIQUE,
  title text NOT NULL,
  published_at timestamptz NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_cb_doc_published ON public.news_cb_doc_cache(published_at DESC);
ALTER TABLE public.news_cb_doc_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cb_doc_cache public read" ON public.news_cb_doc_cache FOR SELECT USING (true);