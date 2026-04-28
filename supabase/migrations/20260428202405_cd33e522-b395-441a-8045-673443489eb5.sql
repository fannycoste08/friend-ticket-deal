
-- Restrict SELECT policy to authenticated users only
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Explicitly deny INSERT, UPDATE and DELETE for all client roles.
-- Role management must go through service-role / admin server processes only.
CREATE POLICY "No client inserts on user_roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No client deletes on user_roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated, anon
  USING (false);
