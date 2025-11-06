-- Fix get_mutual_friends function to properly return results
CREATE OR REPLACE FUNCTION public.get_mutual_friends(user_a uuid, user_b uuid)
RETURNS TABLE(friend_id uuid, friend_name text, friend_email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Get direct connections of user_a
  RETURN QUERY
  WITH user_a_network AS (
    SELECT 
      CASE 
        WHEN i.inviter_id = user_a THEN p.id
        WHEN p.id = user_a THEN i.inviter_id
      END as connection_id
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved'
      AND (i.inviter_id = user_a OR p.id = user_a)
    
    UNION
    
    SELECT 
      CASE 
        WHEN f.user_id = user_a THEN f.friend_id
        WHEN f.friend_id = user_a THEN f.user_id
      END as connection_id
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = user_a OR f.friend_id = user_a)
  ),
  user_b_network AS (
    SELECT 
      CASE 
        WHEN i.inviter_id = user_b THEN p.id
        WHEN p.id = user_b THEN i.inviter_id
      END as connection_id
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved'
      AND (i.inviter_id = user_b OR p.id = user_b)
    
    UNION
    
    SELECT 
      CASE 
        WHEN f.user_id = user_b THEN f.friend_id
        WHEN f.friend_id = user_b THEN f.user_id
      END as connection_id
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = user_b OR f.friend_id = user_b)
  )
  SELECT 
    p.id as friend_id,
    p.name as friend_name,
    p.email as friend_email
  FROM user_a_network a
  INNER JOIN user_b_network b ON a.connection_id = b.connection_id
  INNER JOIN profiles p ON p.id = a.connection_id
  WHERE a.connection_id IS NOT NULL
    AND b.connection_id IS NOT NULL;
END;
$function$