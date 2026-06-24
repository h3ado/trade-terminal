CREATE TABLE IF NOT EXISTS public.cot_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'CFTC public reporting',
  market_rows INTEGER NOT NULL DEFAULT 0,
  legacy_rows INTEGER NOT NULL DEFAULT 0,
  disagg_rows INTEGER NOT NULL DEFAULT 0,
  tff_rows INTEGER NOT NULL DEFAULT 0,
  cit_rows INTEGER NOT NULL DEFAULT 0,
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cot_market_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  asset TEXT NOT NULL,
  market TEXT NOT NULL,
  ticker TEXT NOT NULL,
  open_interest NUMERIC NOT NULL DEFAULT 0,
  commercials NUMERIC NOT NULL DEFAULT 0,
  managed_money NUMERIC NOT NULL DEFAULT 0,
  non_reportable NUMERIC NOT NULL DEFAULT 0,
  week_change NUMERIC NOT NULL DEFAULT 0,
  four_week_change NUMERIC NOT NULL DEFAULT 0,
  pct_rank NUMERIC NOT NULL DEFAULT 50,
  bias TEXT NOT NULL DEFAULT 'Neutral',
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (report_date, ticker)
);

CREATE TABLE IF NOT EXISTS public.cot_report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL,
  market TEXT NOT NULL,
  ticker TEXT,
  row_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (report_date, report_type, market, ticker)
);

ALTER TABLE public.cot_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cot_market_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cot_report_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "COT snapshots are publicly viewable"
ON public.cot_snapshots
FOR SELECT
USING (true);

CREATE POLICY "COT market history is publicly viewable"
ON public.cot_market_history
FOR SELECT
USING (true);

CREATE POLICY "COT report history is publicly viewable"
ON public.cot_report_history
FOR SELECT
USING (true);

CREATE TRIGGER update_cot_snapshots_updated_at
BEFORE UPDATE ON public.cot_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cot_market_history_updated_at
BEFORE UPDATE ON public.cot_market_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cot_report_history_updated_at
BEFORE UPDATE ON public.cot_report_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_cot_market_history_ticker_date ON public.cot_market_history (ticker, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_cot_market_history_date_asset ON public.cot_market_history (report_date DESC, asset);
CREATE INDEX IF NOT EXISTS idx_cot_report_history_type_date ON public.cot_report_history (report_type, report_date DESC);