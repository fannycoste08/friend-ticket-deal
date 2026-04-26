-- Function: get all friends for a given user (admin only)
CREATE OR REPLACE FUNCTION public.get_user_friends_admin(_user_id uuid)
RETURNS TABLE(friend_id uuid, friend_name text, friend_email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS friend_id,
    p.name AS friend_name,
    p.email AS friend_email
  FROM friendships f
  JOIN profiles p ON p.id = CASE
    WHEN f.user_id = _user_id THEN f.friend_id
    ELSE f.user_id
  END
  WHERE (f.user_id = _user_id OR f.friend_id = _user_id)
    AND f.status = 'accepted'
  ORDER BY p.name;
END;
$$;

-- Function: get the inviter (godparent) of a given user (admin only)
CREATE OR REPLACE FUNCTION public.get_user_inviter_admin(_user_id uuid)
RETURNS TABLE(inviter_id uuid, inviter_name text, inviter_email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT email INTO user_email FROM profiles WHERE id = _user_id;

  IF user_email IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS inviter_id,
    p.name AS inviter_name,
    p.email AS inviter_email
  FROM invitations i
  JOIN profiles p ON p.id = i.inviter_id
  WHERE LOWER(i.invitee_email) = LOWER(user_email)
    AND i.status = 'approved'
  ORDER BY i.updated_at DESC
  LIMIT 1;
END;
$$;