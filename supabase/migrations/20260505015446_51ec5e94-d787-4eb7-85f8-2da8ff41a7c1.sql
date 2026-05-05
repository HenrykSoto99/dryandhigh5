REVOKE ALL ON FUNCTION public.detect_message_threats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.detect_message_threats() FROM anon;
REVOKE ALL ON FUNCTION public.detect_message_threats() FROM authenticated;

REVOKE ALL ON FUNCTION public.enforce_single_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_single_admin() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_single_admin() FROM authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;