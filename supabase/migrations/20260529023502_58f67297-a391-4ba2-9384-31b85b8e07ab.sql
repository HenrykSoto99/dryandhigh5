
-- 1) Fix: mexican_holidays exposes operational fields (alert_sent, is_high_risk) to anon.
--    Replace public policy with a column-safe view.
DROP POLICY IF EXISTS "Anyone can read holidays" ON public.mexican_holidays;

CREATE OR REPLACE VIEW public.mexican_holidays_public AS
  SELECT id, name, holiday_date, description
  FROM public.mexican_holidays;

GRANT SELECT ON public.mexican_holidays_public TO anon, authenticated;

-- Keep authenticated read on the base table behind admin policy already in place.
-- (Admins manage holidays remains untouched.)

-- 2) Fix: SECURITY DEFINER functions callable by signed-in users.
--    These are trigger-only / internal; revoke EXECUTE from anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.detect_message_threats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
