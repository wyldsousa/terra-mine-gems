ALTER TABLE public.coin_earnings ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'entrada';
ALTER TABLE public.coin_earnings ADD CONSTRAINT coin_earnings_kind_check CHECK (kind IN ('entrada','saida'));
CREATE INDEX IF NOT EXISTS coin_earnings_user_date_idx ON public.coin_earnings (user_id, earned_at DESC);