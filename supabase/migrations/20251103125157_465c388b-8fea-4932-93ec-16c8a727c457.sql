-- Function to get user's trust network (friends and friends of friends)
CREATE OR REPLACE FUNCTION public.get_extended_network(user_uuid UUID)
RETURNS TABLE (network_user_id UUID, degree INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network AS (
    -- Level 1: Direct connections (my godchildren and my godfather)
    SELECT 
      CASE 
        WHEN i.inviter_id = user_uuid THEN p.id
        WHEN p.id = user_uuid THEN i.inviter_id
      END as user_id,
      1 as level
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'accepted'
      AND (i.inviter_id = user_uuid OR p.id = user_uuid)
    
    UNION
    
    -- Level 2: Friends of friends
    SELECT 
      CASE 
        WHEN i2.inviter_id = n.user_id THEN p2.id
        WHEN p2.id = n.user_id THEN i2.inviter_id
      END as user_id,
      2 as level
    FROM network n
    JOIN invitations i2 ON (i2.inviter_id = n.user_id OR p2.id = n.user_id)
    JOIN profiles p2 ON p2.email = i2.invitee_email
    WHERE n.level = 1
      AND i2.status = 'accepted'
      AND CASE 
        WHEN i2.inviter_id = n.user_id THEN p2.id
        WHEN p2.id = n.user_id THEN i2.inviter_id
      END != user_uuid
  )
  SELECT DISTINCT user_id, level
  FROM network
  WHERE user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;