CREATE TABLE public.custom_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  ticker TEXT,
  sector TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  market_cap NUMERIC,
  hq TEXT,
  notes TEXT,
  override_id TEXT,
  is_deletion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom companies select own"
  ON public.custom_companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Custom companies insert own"
  ON public.custom_companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Custom companies update own"
  ON public.custom_companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Custom companies delete own"
  ON public.custom_companies FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_custom_companies_user_id ON public.custom_companies(user_id);
CREATE INDEX idx_custom_companies_override_id ON public.custom_companies(override_id) WHERE override_id IS NOT NULL;

CREATE TRIGGER update_custom_companies_updated_at
  BEFORE UPDATE ON public.custom_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();