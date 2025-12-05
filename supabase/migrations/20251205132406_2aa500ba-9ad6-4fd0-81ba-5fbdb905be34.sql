-- Drop and recreate view with SECURITY INVOKER (safer)
DROP VIEW IF EXISTS public.profiles_with_friend_count;

CREATE VIEW public.profiles_with_friend_count 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.created_at,
  (
    SELECT COUNT(*)::integer 
    FROM friendships f 
    WHERE (f.user_id = p.id OR f.friend_id = p.id) 
      AND f.status = 'accepted'
  ) as friend_count
FROM profiles p
ORDER BY friend_count DESC;