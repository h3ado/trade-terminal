CREATE TABLE public.trade_news_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  cluster_key TEXT NOT NULL,
  headline TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT,
  tone NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_news_links_trade ON public.trade_news_links(trade_id);
CREATE INDEX idx_trade_news_links_user ON public.trade_news_links(user_id);

ALTER TABLE public.trade_news_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade news links select own" ON public.trade_news_links
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trade news links insert own" ON public.trade_news_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trade news links delete own" ON public.trade_news_links
  FOR DELETE USING (auth.uid() = user_id);