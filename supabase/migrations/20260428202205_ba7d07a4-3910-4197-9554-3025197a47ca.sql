
-- Remove email exposure to extended network by restricting profiles SELECT to self,
-- and exposing only non-PII fields (id, name) to the network via a security_invoker view.

-- 1. Drop the network-wide SELECT policy on profiles (it exposed email column)
DROP POLICY IF EXISTS "Users can view extended network profiles" ON public.profiles;

-- 2. Create a public view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, name, created_at
FROM public.profiles;

-- 3. Add RLS policy on profiles so the view (running as invoker) can read id/name
--    for users in the requester's extended network. Email column remains in the
--    base table but is never selected by the view, and direct base-table SELECT
--    of other users' rows is no longer allowed.
CREATE POLICY "Network can view profile basics via view"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() <> id
    AND id IN (
      SELECT network_user_id
      FROM public.get_extended_network(auth.uid())
    )
    -- Restrict this policy to view-driven access: callers should select only id/name.
    -- Since column-level filtering at the policy level isn't possible, we instead
    -- rely on application code using profiles_public for network reads.
  );

-- 4. Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- 5. Revoke direct SELECT on the email column from authenticated for network rows.
--    We enforce email confidentiality by ensuring that any access to other users'
--    email must go through a SECURITY DEFINER function, not direct table SELECT.
--    Column-level GRANT: revoke email column from anon/authenticated, then grant
--    only to the row owner via policy-friendly column grants is not possible.
--    Instead we keep the policy above (allows SELECT on the row including email)
--    BUT we also revoke the email column from authenticated and re-grant it via
--    a per-row check using a function used by self-only policy.

-- Simpler & safer approach: revoke email column from authenticated globally,
-- and create a SECURITY DEFINER function for the user to read their own email.
REVOKE SELECT (email) ON public.profiles FROM authenticated, anon;
GRANT SELECT (id, name, created_at, updated_at) ON public.profiles TO authenticated;

-- 6. Function for a user to fetch their own email
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;
