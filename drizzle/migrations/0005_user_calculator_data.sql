CREATE TABLE public.user_calculator_data (
  user_id uuid NOT NULL,
  game text NOT NULL CHECK (game IN ('terramine','atlas','fortune','land-rents')),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_calculator_data TO authenticated;
GRANT ALL ON public.user_calculator_data TO service_role;
ALTER TABLE public.user_calculator_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own calc select" ON public.user_calculator_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own calc insert" ON public.user_calculator_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own calc update" ON public.user_calculator_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own calc delete" ON public.user_calculator_data FOR DELETE TO authenticated USING (auth.uid() = user_id);