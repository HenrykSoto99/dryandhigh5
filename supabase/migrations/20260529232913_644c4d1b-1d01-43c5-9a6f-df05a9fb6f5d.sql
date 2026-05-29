CREATE OR REPLACE FUNCTION public.sync_profile_to_telegram_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.telegram_chat_id IS NOT NULL THEN
    UPDATE public.telegram_users
    SET
      first_name = COALESCE(NULLIF(NEW.display_name, ''), NULLIF(NEW.name, ''), first_name),
      sobriety_start_date = COALESCE(NEW.sobriety_start_date, sobriety_start_date),
      preferred_checkin_morning = COALESCE(NEW.check_in_morning, preferred_checkin_morning),
      preferred_checkin_evening = COALESCE(NEW.check_in_evening, preferred_checkin_evening),
      onboarding_completed = COALESCE(NEW.onboarding_complete, onboarding_completed),
      updated_at = now()
    WHERE telegram_chat_id = NEW.telegram_chat_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_to_telegram_user_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_telegram_user_trigger
AFTER INSERT OR UPDATE OF display_name, name, sobriety_start_date, check_in_morning, check_in_evening, onboarding_complete, telegram_chat_id
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_telegram_user();