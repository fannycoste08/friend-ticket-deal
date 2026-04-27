
CREATE OR REPLACE FUNCTION public.get_user_friends_public(_target_user_id uuid)
RETURNS TABLE(friend_id uuid, friend_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS friend_id,
    p.name AS friend_name
  FROM friendships f
  JOIN profiles p ON p.id = CASE
    WHEN f.user_id = _target_user_id THEN f.friend_id
    ELSE f.user_id
  END
  WHERE (f.user_id = _target_user_id OR f.friend_id = _target_user_id)
    AND f.status = 'accepted'
    AND p.id <> auth.uid()
  ORDER BY p.name;
END;
$function$;
