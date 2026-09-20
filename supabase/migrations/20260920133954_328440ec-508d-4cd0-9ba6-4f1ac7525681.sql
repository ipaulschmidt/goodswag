CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  event_url text,
  context_notes text,
  industry_detected text,
  standard_budget_min numeric NOT NULL,
  standard_budget_max numeric NOT NULL,
  reach_budget_max numeric NOT NULL,
  booth_size text NOT NULL DEFAULT 'Standard 10x10',
  staffing_available boolean NOT NULL DEFAULT true,
  attendee_volume text,
  brand_colors text,
  share_slug text NOT NULL UNIQUE,
  generation_status text NOT NULL DEFAULT 'pending',
  generation_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.swag_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tier text NOT NULL,
  item_name text NOT NULL,
  description text NOT NULL,
  rationale text NOT NULL,
  engagement_type text NOT NULL,
  estimated_price numeric,
  supplier_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  trend_tie_in text,
  needs_unavailable_staffing boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  dismiss_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.boring_swag_baseline (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_swag_recs_event ON public.swag_recommendations(event_id);
CREATE INDEX idx_events_share_slug ON public.events(share_slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated, anon;
GRANT ALL ON public.events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swag_recommendations TO authenticated, anon;
GRANT ALL ON public.swag_recommendations TO service_role;
GRANT SELECT ON public.boring_swag_baseline TO authenticated, anon;
GRANT ALL ON public.boring_swag_baseline TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swag_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boring_swag_baseline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_access" ON public.events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "recs_public_access" ON public.swag_recommendations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "baseline_public_read" ON public.boring_swag_baseline FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.boring_swag_baseline (item) VALUES
  ('pens'), ('tote bags'), ('koozies'), ('stress balls'), ('phone chargers/cables'),
  ('water bottles'), ('notepads'), ('mints/candy'), ('USB drives'), ('sunglasses'),
  ('lanyards'), ('mousepads'), ('generic phone stands'), ('branded sticky notes');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();