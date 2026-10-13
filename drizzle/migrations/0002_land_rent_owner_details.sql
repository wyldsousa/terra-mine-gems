ALTER TABLE public.public_stats ADD COLUMN IF NOT EXISTS game_details jsonb;
COMMENT ON COLUMN public.public_stats.game_details IS 'Owner saved Land Rent inputs; never returned wholesale publicly.';
CREATE OR REPLACE FUNCTION public.public_ranking_land_rent_details()
RETURNS TABLE(user_id uuid, badges integer, normal_multiplier numeric, badge_percent numeric, event_total numeric, event_additional numeric, event_enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT s.user_id,
 CASE WHEN 'land-rents' = ANY(p.public_units_games) THEN (s.game_details->>'badges')::integer ELSE NULL END,
 CASE WHEN 'land-rents' = ANY(p.public_income_games) THEN (s.game_details->>'normal_multiplier')::numeric ELSE NULL END,
 CASE WHEN 'land-rents' = ANY(p.public_income_games) THEN (s.game_details->>'badge_percent')::numeric ELSE NULL END,
 CASE WHEN 'land-rents' = ANY(p.public_income_games) THEN (s.game_details->>'event_total')::numeric ELSE NULL END,
 CASE WHEN 'land-rents' = ANY(p.public_income_games) THEN (s.game_details->>'event_additional')::numeric ELSE NULL END,
 CASE WHEN 'land-rents' = ANY(p.public_income_games) THEN (s.game_details->>'event_enabled')::boolean ELSE NULL END
FROM public.public_stats s JOIN public.profiles p ON p.id=s.user_id
WHERE p.ranking_opt_in AND s.game='land-rents' AND s.configured;
$$;
REVOKE ALL ON FUNCTION public.public_ranking_land_rent_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_ranking_land_rent_details() TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.validate_land_rent_details() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.game='land-rents' AND NEW.game_details IS NOT NULL THEN
  IF jsonb_typeof(NEW.game_details)<>'object' OR length(NEW.game_details::text)>30000 THEN RAISE EXCEPTION 'Invalid Land Rent details'; END IF;
  IF (NEW.game_details->>'badges')::numeric NOT BETWEEN 0 AND 200 OR (NEW.game_details->>'badges')::numeric <> trunc((NEW.game_details->>'badges')::numeric) THEN RAISE EXCEPTION 'Invalid badge count'; END IF;
  IF NEW.units_count > 10000 THEN RAISE EXCEPTION 'Invalid plot count'; END IF;
  IF (NEW.game_details->>'normal_multiplier')::numeric NOT IN (1,2,4,5,6) THEN RAISE EXCEPTION 'Invalid normal multiplier'; END IF;
  IF (NEW.game_details->>'badge_percent')::numeric < 0 THEN RAISE EXCEPTION 'Invalid badge bonus'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_land_rent_stats BEFORE INSERT OR UPDATE ON public.public_stats FOR EACH ROW EXECUTE FUNCTION public.validate_land_rent_details();