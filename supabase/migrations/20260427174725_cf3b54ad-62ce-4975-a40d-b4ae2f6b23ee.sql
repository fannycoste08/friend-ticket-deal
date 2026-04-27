
CREATE OR REPLACE FUNCTION public.get_friend_suggestions(_user_id uuid)
RETURNS TABLE(suggestion_id uuid, suggestion_name text, mutual_friend_id uuid, mutual_friend_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only view your own suggestions';
  END IF;

  RETURN QUERY
  WITH direct_friends AS (
    SELECT CASE WHEN f.user_id = _user_id THEN f.friend_id ELSE f.user_id END AS friend_id
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = _user_id OR f.friend_id = _user_id)
  ),
  fof AS (
    SELECT
      CASE WHEN f2.user_id = df.friend_id THEN f2.friend_id ELSE f2.user_id END AS candidate_id,
      df.friend_id AS via_friend_id
    FROM direct_friends df
    JOIN friendships f2
      ON f2.status = 'accepted'
     AND (f2.user_id = df.friend_id OR f2.friend_id = df.friend_id)
  ),
  filtered AS (
    SELECT candidate_id, via_friend_id
    FROM fof
    WHERE candidate_id <> _user_id
      AND candidate_id NOT IN (SELECT friend_id FROM direct_friends)
  ),
  ranked AS (
    SELECT DISTINCT ON (candidate_id)
      candidate_id, via_friend_id
    FROM filtered
    ORDER BY candidate_id, via_friend_id
  )
  SELECT
    r.candidate_id AS suggestion_id,
    p.name AS suggestion_name,
    r.via_friend_id AS mutual_friend_id,
    pv.name AS mutual_friend_name
  FROM ranked r
  JOIN profiles p ON p.id = r.candidate_id
  JOIN profiles pv ON pv.id = r.via_friend_id
  ORDER BY p.name;
END;
$function$;
