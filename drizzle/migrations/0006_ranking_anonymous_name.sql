CREATE OR REPLACE FUNCTION public.public_ranking_snapshot()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, profile_updated_at timestamptz, game text, units_count integer, monthly_income numeric, daily_income numeric, weekly_income numeric, yearly_income numeric, currency text, stats_updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
SELECT p.id, COALESCE(NULLIF(btrim(p.display_name), ''), 'Anônimo'), CASE WHEN p.public_avatar THEN p.avatar_url ELSE NULL END, p.updated_at, s.game,
 CASE WHEN s.configured AND s.game = ANY(p.public_units_games) THEN s.units_count ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.monthly_income ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.daily_income ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.weekly_income ELSE NULL END,
 CASE WHEN s.configured AND s.game = ANY(p.public_income_games) THEN s.yearly_income ELSE NULL END,
 s.currency, s.updated_at
FROM public.profiles p JOIN public.public_stats s ON s.user_id = p.id
WHERE p.ranking_opt_in AND s.game IN ('terramine','fortune','atlas','land-rents')
ORDER BY p.id, s.game;
$$;
REVOKE ALL ON FUNCTION public.public_ranking_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_ranking_snapshot() TO anon, authenticated, service_role;