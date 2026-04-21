-- 1) Profiles: admin can view all profiles (in addition to the user's own)
CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Realtime: restrict subscriptions on realtime.messages to admins only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only realtime subscriptions" ON realtime.messages;
CREATE POLICY "Admins only realtime subscriptions"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) user_roles: explicit RESTRICTIVE deny for non-admins on writes
--    (PERMISSIVE admin ALL policy already exists; RESTRICTIVE policies are AND-combined)
DROP POLICY IF EXISTS "Only admins may insert roles" ON public.user_roles;
CREATE POLICY "Only admins may insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins may update roles" ON public.user_roles;
CREATE POLICY "Only admins may update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins may delete roles" ON public.user_roles;
CREATE POLICY "Only admins may delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'));