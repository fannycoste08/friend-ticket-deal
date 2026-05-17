CREATE OR REPLACE FUNCTION public.get_activated_user_ids(_ids uuid[])
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE u.id = ANY(_ids)
    AND u.last_sign_in_at IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_activated_user_ids(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_activated_user_ids(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_activated_user_ids(uuid[]) TO authenticated;