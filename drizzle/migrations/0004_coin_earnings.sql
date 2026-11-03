CREATE TABLE public.coin_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL CHECK (game IN ('atlas','fortune','terramine')),
  currency text NOT NULL CHECK (currency IN ('AB','FC','TB')),
  amount numeric NOT NULL CHECK (amount > 0 AND amount <= 100000000),
  source text NOT NULL DEFAULT 'outros' CHECK (char_length(source) BETWEEN 1 AND 60),
  earned_at timestamptz NOT NULL DEFAULT now(),
  dedupe_key text NOT NULL CHECK (char_length(dedupe_key) BETWEEN 8 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
GRANT SELECT, INSERT, DELETE ON public.coin_earnings TO authenticated;
GRANT ALL ON public.coin_earnings TO service_role;
ALTER TABLE public.coin_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own earnings select" ON public.coin_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own earnings insert" ON public.coin_earnings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own earnings delete" ON public.coin_earnings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX coin_earnings_user_time ON public.coin_earnings (user_id, earned_at DESC);