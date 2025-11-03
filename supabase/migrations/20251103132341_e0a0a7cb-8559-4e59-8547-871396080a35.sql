-- Update get_extended_network to include accepted friendships as level 1
CREATE OR REPLACE FUNCTION public.get_extended_network(user_uuid uuid)
RETURNS TABLE(network_user_id uuid, degree integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network AS (
    -- Level 1: Direct connections
    -- 1a. From invitations (godfather and godchildren)
    SELECT 
      CASE 
        WHEN i.inviter_id = user_uuid THEN p.id
        WHEN p.id = user_uuid THEN i.inviter_id
      END as user_id,
      1 as level
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved'
      AND (i.inviter_id = user_uuid OR p.id = user_uuid)
    
    UNION
    
    -- 1b. From accepted friendships (bidirectional)
    SELECT 
      CASE 
        WHEN f.user_id = user_uuid THEN f.friend_id
        WHEN f.friend_id = user_uuid THEN f.user_id
      END as user_id,
      1 as level
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = user_uuid OR f.friend_id = user_uuid)
    
    UNION
    
    -- Level 2: Friends of friends
    SELECT 
      CASE 
        WHEN i2.inviter_id = n.user_id THEN p2.id
        WHEN p2.id = n.user_id THEN i2.inviter_id
      END as user_id,
      2 as level
    FROM network n
    CROSS JOIN profiles p2
    JOIN invitations i2 ON (i2.inviter_id = n.user_id OR p2.id = n.user_id) AND p2.email = i2.invitee_email
    WHERE n.level = 1
      AND i2.status = 'approved'
      AND CASE 
        WHEN i2.inviter_id = n.user_id THEN p2.id
        WHEN p2.id = n.user_id THEN i2.inviter_id
      END != user_uuid
      
    UNION
    
    -- Level 2: Friends of friends via friendships
    SELECT 
      CASE 
        WHEN f2.user_id = n.user_id THEN f2.friend_id
        WHEN f2.friend_id = n.user_id THEN f2.user_id
      END as user_id,
      2 as level
    FROM network n
    JOIN friendships f2 ON (f2.user_id = n.user_id OR f2.friend_id = n.user_id)
    WHERE n.level = 1
      AND f2.status = 'accepted'
      AND CASE 
        WHEN f2.user_id = n.user_id THEN f2.friend_id
        WHEN f2.friend_id = n.user_id THEN f2.user_id
      END != user_uuid
  )
  SELECT DISTINCT user_id, MIN(level) as level
  FROM network
  WHERE user_id IS NOT NULL
  GROUP BY user_id;
END;
$function$;