
-- ============================================================
-- 1. ADMIN ÚNICO: henryk.soto@gmail.com
-- ============================================================

-- Borra cualquier admin que no sea henryk.soto@gmail.com
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE email = 'henryk.soto@gmail.com'
  );

-- Asigna admin a henryk.soto@gmail.com si la cuenta ya existe y aún no lo es
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'henryk.soto@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.users.id AND role = 'admin'
  );

-- ============================================================
-- 2. TRIGGER GUARDIÁN: nadie más puede ser admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  attempted_email text;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT id INTO owner_id FROM auth.users WHERE email = 'henryk.soto@gmail.com' LIMIT 1;

    IF owner_id IS NULL OR NEW.user_id <> owner_id THEN
      SELECT email INTO attempted_email FROM auth.users WHERE id = NEW.user_id;

      INSERT INTO public.security_alerts (
        alert_type, severity, summary, details
      ) VALUES (
        'privilege_escalation_attempt',
        'critical',
        'Intento de escalada a admin bloqueado',
        jsonb_build_object(
          'attempted_user_id', NEW.user_id,
          'attempted_email', attempted_email,
          'attempted_role', NEW.role,
          'blocked_at', now()
        )
      );

      RAISE EXCEPTION 'Solo el dueño puede tener rol admin';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. TABLA DE ALERTAS DE SEGURIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_telegram_user_id uuid REFERENCES public.telegram_users(id) ON DELETE SET NULL,
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON public.security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unnotified ON public.security_alerts(notified) WHERE notified = false;

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view security alerts"
  ON public.security_alerts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update security alerts"
  ON public.security_alerts FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ahora sí podemos crear el trigger sobre user_roles porque security_alerts ya existe
DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trigger
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

-- ============================================================
-- 4. AJUSTES DE ADMIN (chat_id de Telegram para notificaciones)
-- ============================================================
INSERT INTO public.bot_settings (setting_key, setting_value, description)
VALUES (
  'admin_telegram_chat_id',
  'null'::jsonb,
  'Chat ID de Telegram del admin único para recibir alertas de seguridad. Configurar desde el panel admin.'
)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.bot_settings (setting_key, setting_value, description)
VALUES (
  'admin_email',
  '"henryk.soto@gmail.com"'::jsonb,
  'Email del admin único y dueño del proyecto'
)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- 5. DETECCIÓN AUTOMÁTICA DE PROMPT INJECTION EN MENSAJES
-- ============================================================
CREATE OR REPLACE FUNCTION public.detect_message_threats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lower_content text;
  matched_patterns text[] := ARRAY[]::text[];
BEGIN
  IF NEW.message_type <> 'user' OR NEW.content IS NULL THEN
    RETURN NEW;
  END IF;

  lower_content := lower(NEW.content);

  -- Patrones clásicos de prompt injection
  IF lower_content ~ '(ignore|olvida|forget).{0,30}(previous|anterior|instructions|instrucciones|rules|reglas)' THEN
    matched_patterns := array_append(matched_patterns, 'ignore_previous_instructions');
  END IF;

  IF lower_content ~ '(system\s*prompt|prompt\s*del?\s*sistema|reveal.{0,20}prompt|muestra.{0,20}(prompt|instrucciones))' THEN
    matched_patterns := array_append(matched_patterns, 'system_prompt_extraction');
  END IF;

  IF lower_content ~ '(you are now|ahora eres|act as|actua como|pretend|finge).{0,40}(admin|developer|root|system|jailbreak|dan)' THEN
    matched_patterns := array_append(matched_patterns, 'role_hijack');
  END IF;

  IF lower_content ~ '(api[_\s-]?key|service[_\s-]?role|supabase|database|contraseñ|password|token)' THEN
    matched_patterns := array_append(matched_patterns, 'credential_probe');
  END IF;

  IF lower_content ~ '(\<script|javascript:|onerror=|onload=|<iframe|drop\s+table|union\s+select|--\s*$)' THEN
    matched_patterns := array_append(matched_patterns, 'injection_payload');
  END IF;

  IF lower_content ~ '(http|https|t\.me|bit\.ly|tinyurl).{0,200}(verifica|verify|claim|reclama|gratis|free|premium|recupera)' THEN
    matched_patterns := array_append(matched_patterns, 'phishing_link');
  END IF;

  IF array_length(matched_patterns, 1) > 0 THEN
    INSERT INTO public.security_alerts (
      alert_type, severity, summary, details, source_telegram_user_id
    ) VALUES (
      'suspicious_message',
      CASE WHEN array_length(matched_patterns, 1) >= 2 THEN 'critical' ELSE 'warning' END,
      'Mensaje sospechoso detectado en el bot',
      jsonb_build_object(
        'patterns', matched_patterns,
        'message_id', NEW.id,
        'content_preview', left(NEW.content, 200)
      ),
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS detect_message_threats_trigger ON public.telegram_messages;
CREATE TRIGGER detect_message_threats_trigger
AFTER INSERT ON public.telegram_messages
FOR EACH ROW EXECUTE FUNCTION public.detect_message_threats();

-- ============================================================
-- 6. REALTIME para alertas
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;
