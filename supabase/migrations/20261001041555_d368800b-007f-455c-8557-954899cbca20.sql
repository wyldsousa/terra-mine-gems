CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Jogador' CHECK (char_length(display_name) BETWEEN 1 AND 40),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) < 120000),
  ranking_opt_in boolean NOT NULL DEFAULT false,
  calculators text[] NOT NULL DEFAULT ARRAY['terramine']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sees opted-in profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (ranking_opt_in = true OR auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.public_stats (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game text NOT NULL CHECK (game IN ('terramine','atlas','fortune')),
  units_count integer NOT NULL DEFAULT 0 CHECK (units_count >= 0 AND units_count <= 1000000),
  monthly_income numeric NOT NULL DEFAULT 0 CHECK (monthly_income >= 0 AND monthly_income < 1000000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game)
);
GRANT SELECT ON public.public_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_stats TO authenticated;
GRANT ALL ON public.public_stats TO service_role;
ALTER TABLE public.public_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sees opted-in stats" ON public.public_stats FOR SELECT TO anon, authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.ranking_opt_in)
);
CREATE POLICY "Own stats insert" ON public.public_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own stats update" ON public.public_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own stats delete" ON public.public_stats FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER stats_touch BEFORE UPDATE ON public.public_stats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();