
ALTER VIEW public.mexican_holidays_public SET (security_invoker = true);

-- Allow anon to read base columns needed by the view
GRANT SELECT (id, name, holiday_date, description) ON public.mexican_holidays TO anon;
