
-- telegram_bot_state: lock down — only service role (which bypasses RLS) can touch it
-- Add a deny-all policy so no authenticated/anon user can access it
CREATE POLICY "Deny all access to bot state"
  ON public.telegram_bot_state FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);
