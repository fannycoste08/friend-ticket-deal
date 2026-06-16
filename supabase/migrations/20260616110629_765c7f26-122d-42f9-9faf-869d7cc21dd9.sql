
CREATE OR REPLACE FUNCTION public.get_activated_user_ids(_ids uuid[])
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id FROM public.profiles p
  WHERE p.id = ANY(_ids) AND p.password_set_at IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.get_friend_count(profile_id uuid)
 RETURNS integer
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM friendships f
  JOIN profiles p ON p.id = CASE WHEN f.user_id = profile_id THEN f.friend_id ELSE f.user_id END
  WHERE (f.user_id = profile_id OR f.friend_id = profile_id)
    AND f.status = 'accepted'
    AND p.password_set_at IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_friends_public(_target_user_id uuid)
 RETURNS TABLE(friend_id uuid, friend_name text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT p.id, p.name
  FROM friendships f
  JOIN profiles p ON p.id = CASE WHEN f.user_id = _target_user_id THEN f.friend_id ELSE f.user_id END
  WHERE (f.user_id = _target_user_id OR f.friend_id = _target_user_id)
    AND f.status = 'accepted'
    AND p.id <> auth.uid()
    AND p.password_set_at IS NOT NULL
  ORDER BY p.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_friend_suggestions(_user_id uuid)
 RETURNS TABLE(suggestion_id uuid, suggestion_name text, mutual_friend_id uuid, mutual_friend_name text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id <> auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  WITH direct_friends AS (
    SELECT CASE WHEN f.user_id = _user_id THEN f.friend_id ELSE f.user_id END AS friend_id
    FROM friendships f
    WHERE f.status = 'accepted' AND (f.user_id = _user_id OR f.friend_id = _user_id)
  ),
  fof AS (
    SELECT CASE WHEN f2.user_id = df.friend_id THEN f2.friend_id ELSE f2.user_id END AS candidate_id,
           df.friend_id AS via_friend_id
    FROM direct_friends df
    JOIN friendships f2 ON f2.status = 'accepted'
     AND (f2.user_id = df.friend_id OR f2.friend_id = df.friend_id)
  ),
  filtered AS (
    SELECT candidate_id, via_friend_id FROM fof
    WHERE candidate_id <> _user_id
      AND candidate_id NOT IN (SELECT friend_id FROM direct_friends)
  ),
  ranked AS (
    SELECT DISTINCT ON (candidate_id) candidate_id, via_friend_id
    FROM filtered ORDER BY candidate_id, via_friend_id
  )
  SELECT r.candidate_id, p.name, r.via_friend_id, pv.name
  FROM ranked r
  JOIN profiles p ON p.id = r.candidate_id
  JOIN profiles pv ON pv.id = r.via_friend_id
  WHERE p.password_set_at IS NOT NULL
  ORDER BY p.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_mutual_friends(user_a uuid, user_b uuid)
 RETURNS TABLE(friend_id uuid, friend_name text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF user_a != auth.uid() AND user_b != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  WITH user_a_network AS (
    SELECT CASE WHEN i.inviter_id = user_a THEN p.id WHEN p.id = user_a THEN i.inviter_id END AS connection_id
    FROM invitations i JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved' AND (i.inviter_id = user_a OR p.id = user_a)
    UNION
    SELECT CASE WHEN f.user_id = user_a THEN f.friend_id WHEN f.friend_id = user_a THEN f.user_id END
    FROM friendships f WHERE f.status = 'accepted' AND (f.user_id = user_a OR f.friend_id = user_a)
  ),
  user_b_network AS (
    SELECT CASE WHEN i.inviter_id = user_b THEN p.id WHEN p.id = user_b THEN i.inviter_id END AS connection_id
    FROM invitations i JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved' AND (i.inviter_id = user_b OR p.id = user_b)
    UNION
    SELECT CASE WHEN f.user_id = user_b THEN f.friend_id WHEN f.friend_id = user_b THEN f.user_id END
    FROM friendships f WHERE f.status = 'accepted' AND (f.user_id = user_b OR f.friend_id = user_b)
  )
  SELECT p.id, p.name
  FROM user_a_network a
  INNER JOIN user_b_network b ON a.connection_id = b.connection_id
  INNER JOIN profiles p ON p.id = a.connection_id
  WHERE a.connection_id IS NOT NULL AND b.connection_id IS NOT NULL
    AND p.password_set_at IS NOT NULL;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_user_stats();
CREATE FUNCTION public.get_admin_user_stats()
 RETURNS TABLE(id uuid, name text, email text, created_at timestamp with time zone, friend_count integer, active_tickets integer, active_wanted integer, messages_sent integer, messages_received integer, last_sign_in_at timestamp with time zone, has_password boolean, password_set_at timestamp with time zone, account_state text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  RETURN QUERY
  SELECT
    p.id, p.name, p.email, p.created_at,
    public.get_friend_count(p.id),
    COALESCE((SELECT COUNT(*)::int FROM tickets t WHERE t.user_id = p.id AND t.event_date >= CURRENT_DATE), 0),
    COALESCE((SELECT COUNT(*)::int FROM wanted_tickets w WHERE w.user_id = p.id AND w.event_date >= CURRENT_DATE), 0),
    COALESCE((SELECT COUNT(*)::int FROM email_logs e WHERE e.user_id = p.id AND e.function_name = 'send-contact-email'), 0),
    COALESCE((SELECT COUNT(*)::int FROM email_logs e WHERE LOWER(e.recipient_email) = LOWER(p.email) AND e.function_name = 'send-contact-email'), 0),
    (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id = p.id),
    (SELECT u.encrypted_password IS NOT NULL FROM auth.users u WHERE u.id = p.id),
    p.password_set_at,
    CASE
      WHEN p.password_set_at IS NULL THEN 'sin_password'
      WHEN (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id = p.id) IS NULL THEN 'password_sin_login'
      ELSE 'activo'
    END
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$function$;
