-- Create a security definer function to get friend count (bypasses RLS for admins)
CREATE OR REPLACE FUNCTION public.get_friend_count(profile_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer 
  FROM friendships f 
  WHERE (f.user_id = profile_id OR f.friend_id = profile_id) 
    AND f.status = 'accepted'
$$;

-- Recreate the view using the function
DROP VIEW IF EXISTS public.profiles_with_friend_count;

CREATE VIEW public.profiles_with_friend_count 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.created_at,
  public.get_friend_count(p.id) as friend_count
FROM profiles p
ORDER BY friend_count DESC;