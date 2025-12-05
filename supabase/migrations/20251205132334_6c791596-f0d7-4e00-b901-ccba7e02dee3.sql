-- Create a view that shows profiles with friend count
CREATE OR REPLACE VIEW public.profiles_with_friend_count AS
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