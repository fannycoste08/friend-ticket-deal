-- Fix get_extended_network recursive CTE
DROP FUNCTION IF EXISTS public.get_extended_network(uuid);

CREATE OR REPLACE FUNCTION public.get_extended_network(user_uuid uuid)
RETURNS TABLE(network_user_id uuid, degree integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH level_1 AS (
    -- Direct connections from invitations (godfather and godchildren)
    SELECT 
      CASE 
        WHEN i.inviter_id = user_uuid THEN p.id
        WHEN p.id = user_uuid THEN i.inviter_id
      END as user_id
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved'
      AND (i.inviter_id = user_uuid OR p.id = user_uuid)
    
    UNION
    
    -- Direct connections from accepted friendships (bidirectional)
    SELECT 
      CASE 
        WHEN f.user_id = user_uuid THEN f.friend_id
        WHEN f.friend_id = user_uuid THEN f.user_id
      END as user_id
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = user_uuid OR f.friend_id = user_uuid)
  ),
  level_2 AS (
    -- Friends of friends via invitations
    SELECT DISTINCT
      CASE 
        WHEN i2.inviter_id = l1.user_id THEN p2.id
        WHEN p2.id = l1.user_id THEN i2.inviter_id
      END as user_id
    FROM level_1 l1
    CROSS JOIN profiles p2
    JOIN invitations i2 ON (i2.inviter_id = l1.user_id OR p2.id = l1.user_id) AND p2.email = i2.invitee_email
    WHERE i2.status = 'approved'
      AND CASE 
        WHEN i2.inviter_id = l1.user_id THEN p2.id
        WHEN p2.id = l1.user_id THEN i2.inviter_id
      END != user_uuid
      AND CASE 
        WHEN i2.inviter_id = l1.user_id THEN p2.id
        WHEN p2.id = l1.user_id THEN i2.inviter_id
      END NOT IN (SELECT user_id FROM level_1)
      
    UNION
    
    -- Friends of friends via friendships
    SELECT DISTINCT
      CASE 
        WHEN f2.user_id = l1.user_id THEN f2.friend_id
        WHEN f2.friend_id = l1.user_id THEN f2.user_id
      END as user_id
    FROM level_1 l1
    JOIN friendships f2 ON (f2.user_id = l1.user_id OR f2.friend_id = l1.user_id)
    WHERE f2.status = 'accepted'
      AND CASE 
        WHEN f2.user_id = l1.user_id THEN f2.friend_id
        WHEN f2.friend_id = l1.user_id THEN f2.user_id
      END != user_uuid
      AND CASE 
        WHEN f2.user_id = l1.user_id THEN f2.friend_id
        WHEN f2.friend_id = l1.user_id THEN f2.user_id
      END NOT IN (SELECT user_id FROM level_1)
  )
  SELECT user_id, 1 as degree FROM level_1 WHERE user_id IS NOT NULL
  UNION
  SELECT user_id, 2 as degree FROM level_2 WHERE user_id IS NOT NULL;
END;
$function$;