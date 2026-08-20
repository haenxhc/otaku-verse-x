CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','expired','cancelled');
CREATE TYPE public.payment_method AS ENUM ('moncash','natcash','kobara');

CREATE TABLE public.premium_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  amount_htg NUMERIC(10,2) NOT NULL CHECK (amount_htg > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_plans TO anon;
GRANT SELECT ON public.premium_plans TO authenticated;
GRANT ALL ON public.premium_plans TO service_role;
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_plans_public_read" ON public.premium_plans FOR SELECT USING (is_active);

INSERT INTO public.premium_plans (code, name, description, amount_htg, duration_days, sort_order)
VALUES ('premium_monthly', 'Premium mensuel', 'Accès au visionnage Premium pendant 30 jours.', 400.00, 30, 1);

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.premium_plans(id),
  gateway TEXT NOT NULL DEFAULT 'kobara',
  method public.payment_method NOT NULL DEFAULT 'kobara',
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'HTG',
  status public.payment_status NOT NULL DEFAULT 'pending',
  kobara_payment_id TEXT UNIQUE,
  kobara_reference TEXT,
  provider_transaction_id TEXT,
  checkout_url TEXT,
  premium_expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX payments_user_idx ON public.payments (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.premium_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.premium_plans(id),
  last_payment_id UUID REFERENCES public.payments(id),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_subscriptions TO authenticated;
GRANT ALL ON public.premium_subscriptions TO service_role;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_subscriptions_select_own" ON public.premium_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_premium_subs_updated BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_active_premium(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.premium_subscriptions
    WHERE user_id = _user_id AND current_period_end > now()
  )
$$;
REVOKE ALL ON FUNCTION public.has_active_premium(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_active_premium(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_active_premium(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_premium(UUID) TO service_role;

CREATE TABLE public.watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anime_id INTEGER NOT NULL,
  episode INTEGER NOT NULL CHECK (episode > 0),
  title TEXT,
  cover_image TEXT,
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  duration_seconds INTEGER,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  source_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, anime_id, episode)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_history TO authenticated;
GRANT ALL ON public.watch_history TO service_role;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watch_history_own" ON public.watch_history FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_watch_history_updated BEFORE UPDATE ON public.watch_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.kobara_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kobara_webhook_events TO authenticated;
GRANT ALL ON public.kobara_webhook_events TO service_role;
ALTER TABLE public.kobara_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kobara_events_admin_read" ON public.kobara_webhook_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));