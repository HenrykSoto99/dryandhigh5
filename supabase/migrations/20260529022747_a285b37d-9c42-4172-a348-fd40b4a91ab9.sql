
-- 1. Campo de consentimiento en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emergency_contact_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_contact_consent_at timestamptz;

-- 2. Trigger: nueva cuenta -> alerta de seguridad (la levanta el security-monitor por Telegram)
CREATE OR REPLACE FUNCTION public.notify_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_alerts (alert_type, severity, summary, details)
  VALUES (
    'new_account_signup',
    'warning',
    'Nueva cuenta registrada en el dashboard',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_notify_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_signup();
