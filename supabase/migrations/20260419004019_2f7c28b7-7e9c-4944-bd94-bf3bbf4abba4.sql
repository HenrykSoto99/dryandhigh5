
-- Expand profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS sobriety_start_date date,
  ADD COLUMN IF NOT EXISTS check_in_morning time NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS check_in_evening time NOT NULL DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint UNIQUE;

-- emotional_logs
CREATE TABLE IF NOT EXISTS public.emotional_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  telegram_user_id uuid REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  emotion text NOT NULL,
  intensity int CHECK (intensity BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emotional_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own emotional logs"
  ON public.emotional_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own emotional logs"
  ON public.emotional_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_emotional_logs_user ON public.emotional_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_logs_tg ON public.emotional_logs(telegram_user_id, created_at DESC);

-- milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  telegram_user_id uuid REFERENCES public.telegram_users(id) ON DELETE CASCADE,
  milestone_type text NOT NULL,
  days_count int NOT NULL,
  reached_at timestamptz NOT NULL DEFAULT now(),
  celebrated boolean NOT NULL DEFAULT false,
  UNIQUE (telegram_user_id, days_count)
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own milestones"
  ON public.milestones FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- mexican_holidays add is_high_risk + public read
ALTER TABLE public.mexican_holidays
  ADD COLUMN IF NOT EXISTS is_high_risk boolean NOT NULL DEFAULT true;

CREATE POLICY "Anyone can read holidays"
  ON public.mexican_holidays FOR SELECT TO anon, authenticated
  USING (true);

-- broadcast_campaigns: admin select policy already exists via ALL
-- Already handled

-- Seed bot_settings critical entries (idempotent)
INSERT INTO public.bot_settings (setting_key, setting_value, description) VALUES
  ('telegram_update_offset', '0'::jsonb, 'Last processed Telegram update_id'),
  ('crisis_keywords_high', '["recaida","recaída","caí","tomé","me emborrache","me emborraché","quiero morir","no puedo más","me quiero empedar","suicidio","matarme"]'::jsonb, 'High severity crisis keywords'),
  ('crisis_keywords_medium', '["tentación","tentacion","ansiedad","quiero tomar","quiero beber","quiero chupar","ganas de tomar","se me antoja","antojo"]'::jsonb, 'Medium severity crisis keywords'),
  ('crisis_keywords_low', '["difícil","dificil","complicado","mal día","mal dia","estresado","estresada","presión","presion"]'::jsonb, 'Low severity crisis keywords'),
  ('checkin_morning_templates', '["¡Buenos días, {nombre}! 🌅 Hoy es tu día {dias_sobriedad} de libertad. ¡Qué chingón suena eso! ¿Cómo amaneciste?","¡Arriba, {nombre}! ☀️ Otro día más en tu camino, ya van {dias_sobriedad}. ¿Qué planes tienes para hoy?","¡Qué onda, {nombre}! 🌄 Día {dias_sobriedad} y contando. ¿Cómo te sientes esta mañana?"]'::jsonb, 'Morning check-in templates'),
  ('checkin_evening_templates', '["Oye {nombre}, ¿cómo te fue hoy? 💪 Cuéntame cómo estuvo tu día.","Hey {nombre}, ya casi termina el día {dias_sobriedad}. 🌙 ¿Cómo la llevas?","¿Qué tal, {nombre}? 🌆 Otro día más que sumas. ¿Cómo te sientes esta noche?"]'::jsonb, 'Evening check-in templates')
ON CONFLICT (setting_key) DO NOTHING;

-- Add unique constraint on bot_settings.setting_key if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bot_settings_setting_key_key'
  ) THEN
    ALTER TABLE public.bot_settings ADD CONSTRAINT bot_settings_setting_key_key UNIQUE (setting_key);
  END IF;
END $$;

-- Seed mexican_holidays (idempotent via name+date check)
INSERT INTO public.mexican_holidays (name, holiday_date, description, is_high_risk)
SELECT * FROM (VALUES
  ('Año Nuevo', '2027-01-01'::date, 'Celebración de Año Nuevo', true),
  ('Día de la Constitución', '2026-02-05'::date, 'Aniversario de la Constitución', false),
  ('Natalicio de Benito Juárez', '2026-03-21'::date, 'Natalicio Benito Juárez', false),
  ('Día del Trabajo', '2026-05-01'::date, 'Día Internacional del Trabajo', true),
  ('Día de las Madres', '2026-05-10'::date, 'Día de las Madres en México', true),
  ('Día del Padre', '2026-06-21'::date, 'Día del Padre (tercer domingo de junio)', true),
  ('Día de la Independencia', '2026-09-16'::date, 'Grito de Independencia', true),
  ('Día de Muertos', '2026-11-01'::date, 'Día de Todos los Santos', true),
  ('Día de Muertos', '2026-11-02'::date, 'Día de los Fieles Difuntos', true),
  ('Día de la Revolución', '2026-11-20'::date, 'Aniversario de la Revolución Mexicana', true),
  ('Navidad', '2026-12-25'::date, 'Navidad', true),
  ('Nochevieja', '2026-12-31'::date, 'Fin de Año', true)
) AS h(name, holiday_date, description, is_high_risk)
WHERE NOT EXISTS (
  SELECT 1 FROM public.mexican_holidays mh WHERE mh.name = h.name AND mh.holiday_date = h.holiday_date
);
