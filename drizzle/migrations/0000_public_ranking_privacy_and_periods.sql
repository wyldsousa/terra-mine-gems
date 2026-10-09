ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_income_games text[] NOT NULL DEFAULT ARRAY['terramine','fortune','atlas']::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_units_games text[] NOT NULL DEFAULT ARRAY['terramine','fortune','atlas']::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_avatar boolean NOT NULL DEFAULT true;
ALTER TABLE public.public_stats ADD COLUMN IF NOT EXISTS configured boolean NOT NULL DEFAULT true;
ALTER TABLE public.public_stats ADD COLUMN IF NOT EXISTS daily_income numeric;
ALTER TABLE public.public_stats ADD COLUMN IF NOT EXISTS weekly_income numeric;
ALTER TABLE public.public_stats ADD COLUMN IF NOT EXISTS yearly_income numeric;
ALTER TABLE public.public_stats ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
UPDATE public.public_stats SET configured = units_count > 0, currency = CASE WHEN game = 'fortune' THEN 'EUR' ELSE 'USD' END;
ALTER POLICY "Public sees opted-in profiles" ON public.profiles USING (auth.uid() = id);
ALTER POLICY "Public sees opted-in stats" ON public.public_stats USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.public_stats TO authenticated;
GRANT ALL ON public.profiles, public.public_stats TO service_role;
CREATE OR REPLACE FUNCTION public.public_ranking_snapshot()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, profile_updated_at timestamptz, game text, units_count integer, monthly_income numeric, daily_income numeric, weekly_income numeric, yearly_income numeric, currency text, stats_updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
SELECT p.id, p.display_name, CASE WHEN p.public_avatar THEN p.avatar_url ELSE NULL END, p.updated_at, s.game,
 CASE WHEN s.configured AND s.game = ANY(p.public_units_games) THEN s.units_count ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.monthly_income ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.daily_income ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.weekly_income ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.yearly_income ELSE NULL END,
 s.currency, s.updated_at
FROM public.profiles p JOIN public.public_stats s ON s.user_id = p.id
WHERE p.ranking_opt_in AND s.game IN ('terramine','fortune','atlas')
ORDER BY p.id, s.game;
$$;
REVOKE ALL ON FUNCTION public.public_ranking_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_ranking_snapshot() TO anon, authenticated, service_role;