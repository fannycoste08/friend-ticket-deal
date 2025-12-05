-- Create a secure admin-only function to get profiles with friend count
CREATE OR REPLACE FUNCTION public.get_profiles_with_friend_count_admin()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  created_at timestamptz,
  friend_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.created_at,
    public.get_friend_count(p.id) as friend_count
  FROM public.profiles p
  ORDER BY public.get_friend_count(p.id) DESC;
END;
$$;