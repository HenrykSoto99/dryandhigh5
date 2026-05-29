
CREATE OR REPLACE FUNCTION public.rotate_cron_internal_secret(p_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHBtdmVqbnZ5aHd3cHdxbW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDQyMTksImV4cCI6MjA4OTA4MDIxOX0.gyAvSFw5J7O8TBqqBbLCAeaE-d2SeQWOQJByF6QITEU';
  v_base text := 'https://pklpmvejnvyhwwpwqmoj.supabase.co/functions/v1/';
  v_headers jsonb;
BEGIN
  IF p_secret IS NULL OR length(p_secret) < 16 THEN
    RAISE EXCEPTION 'invalid secret';
  END IF;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_anon,
    'x-internal-secret', p_secret
  );

  PERFORM cron.unschedule('poll-telegram-updates');
  PERFORM cron.unschedule('scheduled-checkins-job');
  PERFORM cron.unschedule('preventive-alerts-job');
  PERFORM cron.unschedule('security-monitor-poll');

  PERFORM cron.schedule('poll-telegram-updates', '* * * * *',
    format($f$SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:='{}'::jsonb);$f$,
      v_base || 'telegram-poll', v_headers::text));

  PERFORM cron.schedule('scheduled-checkins-job', '*/30 * * * *',
    format($f$SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:='{}'::jsonb);$f$,
      v_base || 'scheduled-checkins', v_headers::text));

  PERFORM cron.schedule('preventive-alerts-job', '0 * * * *',
    format($f$SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:='{}'::jsonb);$f$,
      v_base || 'preventive-alerts', v_headers::text));

  PERFORM cron.schedule('security-monitor-poll', '* * * * *',
    format($f$SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:='{}'::jsonb);$f$,
      v_base || 'security-monitor', v_headers::text));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_cron_internal_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_cron_internal_secret(text) TO service_role;
