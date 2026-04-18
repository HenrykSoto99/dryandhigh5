-- ============================================
-- ROLES SYSTEM (security definer pattern)
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PROFILES (web admin users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TIMESTAMP UPDATE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TELEGRAM USERS
-- ============================================
CREATE TYPE public.risk_level_enum AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE public.telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL UNIQUE,
  telegram_chat_id BIGINT NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step TEXT,
  sobriety_start_date DATE,
  preferred_checkin_morning TIME NOT NULL DEFAULT '08:00:00',
  preferred_checkin_evening TIME NOT NULL DEFAULT '20:00:00',
  risk_level risk_level_enum NOT NULL DEFAULT 'low',
  emotional_state TEXT,
  conversation_summary TEXT,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_users_user_id ON public.telegram_users(telegram_user_id);
CREATE INDEX idx_telegram_users_chat_id ON public.telegram_users(telegram_chat_id);

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all telegram users"
  ON public.telegram_users FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update telegram users"
  ON public.telegram_users FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_telegram_users_updated_at
  BEFORE UPDATE ON public.telegram_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TELEGRAM MESSAGES
-- ============================================
CREATE TYPE public.message_type_enum AS ENUM ('user', 'bot', 'system');

CREATE TABLE public.telegram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID,
  message_type message_type_enum NOT NULL,
  content TEXT NOT NULL,
  telegram_message_id BIGINT,
  ai_confidence NUMERIC(3,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_user ON public.telegram_messages(user_id, created_at DESC);

ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages"
  ON public.telegram_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TELEGRAM CONVERSATIONS (current state per user)
-- ============================================
CREATE TABLE public.telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  current_step TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_conv_user ON public.telegram_conversations(user_id, created_at DESC);

ALTER TABLE public.telegram_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view conversations"
  ON public.telegram_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_telegram_conversations_updated_at
  BEFORE UPDATE ON public.telegram_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- BOT EVENTS
-- ============================================
CREATE TYPE public.severity_enum AS ENUM ('info', 'warning', 'critical');

CREATE TABLE public.bot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity severity_enum NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_events_created ON public.bot_events(created_at DESC);
CREATE INDEX idx_bot_events_user ON public.bot_events(user_id);

ALTER TABLE public.bot_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bot events"
  ON public.bot_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CRISIS FLAGS
-- ============================================
CREATE TABLE public.crisis_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.telegram_users(id) ON DELETE CASCADE NOT NULL,
  severity risk_level_enum NOT NULL,
  trigger_keywords TEXT[] NOT NULL DEFAULT '{}',
  response_sent BOOLEAN NOT NULL DEFAULT false,
  admin_acknowledged BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crisis_flags_unresolved ON public.crisis_flags(resolved, created_at DESC);

ALTER TABLE public.crisis_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view crisis flags"
  ON public.crisis_flags FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update crisis flags"
  ON public.crisis_flags FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_crisis_flags_updated_at
  BEFORE UPDATE ON public.crisis_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- BOT SETTINGS
-- ============================================
CREATE TABLE public.bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage bot settings"
  ON public.bot_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bot_settings_updated_at
  BEFORE UPDATE ON public.bot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MEXICAN HOLIDAYS
-- ============================================
CREATE TABLE public.mexican_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  description TEXT,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mexican_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage holidays"
  ON public.mexican_holidays FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- BROADCAST CAMPAIGNS
-- ============================================
CREATE TABLE public.broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  recipients_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaigns"
  ON public.broadcast_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TELEGRAM BOT POLLING STATE (for getUpdates)
-- ============================================
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

-- No policies — only service_role can access

-- ============================================
-- SEED DATA
-- ============================================

-- Crisis keywords (Mexican Spanish)
INSERT INTO public.bot_settings (setting_key, setting_value, description) VALUES
  ('crisis_keywords', '["tentación","tentacion","ansiedad","caí","cai","recaída","recaida","quiero tomar","quiero beber","quiero chupar","no puedo más","no puedo mas","me quiero empedar","me quiero morir","suicid","ya no aguanto","una copa","una chela","una cerveza","ganas de tomar","necesito un trago","quiero un trago"]'::jsonb, 'Palabras clave que activan detección de crisis'),
  ('crisis_hotline_mx', '{"name":"SAPTEL","phone":"55-5259-8121","description":"Línea de crisis emocional 24/7 en México"}'::jsonb, 'Línea de ayuda en crisis'),
  ('milestones', '[1,7,14,30,60,100,180,365,730]'::jsonb, 'Días de sobriedad que se celebran como hitos');

-- Mexican holidays (high-risk drinking days)
INSERT INTO public.mexican_holidays (name, holiday_date, description) VALUES
  ('Año Nuevo', '2026-01-01', 'Celebración de año nuevo, alto riesgo'),
  ('Día de la Constitución', '2026-02-02', 'Día festivo'),
  ('Día de la Bandera', '2026-02-24', 'Día festivo'),
  ('Natalicio de Benito Juárez', '2026-03-16', 'Día festivo'),
  ('Día del Trabajo', '2026-05-01', 'Día festivo'),
  ('Día de la Madre', '2026-05-10', 'Celebración familiar'),
  ('Día del Padre', '2026-06-21', 'Celebración familiar'),
  ('Día de la Independencia', '2026-09-16', 'Grito de Independencia, alto riesgo'),
  ('Día de Muertos', '2026-11-02', 'Tradición mexicana'),
  ('Revolución Mexicana', '2026-11-16', 'Día festivo'),
  ('Día de la Virgen de Guadalupe', '2026-12-12', 'Celebración religiosa'),
  ('Posadas', '2026-12-16', 'Inicio de posadas navideñas, alto riesgo'),
  ('Nochebuena', '2026-12-24', 'Cena navideña, alto riesgo'),
  ('Navidad', '2026-12-25', 'Día festivo, alto riesgo'),
  ('Fin de Año', '2026-12-31', 'Celebración de año nuevo, alto riesgo');