REVOKE ALL ON FUNCTION public.sync_profile_to_telegram_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_profile_to_telegram_user() FROM anon;
REVOKE ALL ON FUNCTION public.sync_profile_to_telegram_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_to_telegram_user() TO service_role;