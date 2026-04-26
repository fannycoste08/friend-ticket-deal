-- Admin function: list user's invitees (godchildren) — approved invitations only
CREATE OR REPLACE FUNCTION public.get_user_invitees_admin(_user_id uuid)
RETURNS TABLE(invitee_id uuid, invitee_name text, invitee_email text, status text, created_at timestamptz)
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
    p.id AS invitee_id,
    COALESCE(p.name, i.invitee_name) AS invitee_name,
    i.invitee_email,
    i.status,
    i.created_at
  FROM invitations i
  LEFT JOIN profiles p ON LOWER(p.email) = LOWER(i.invitee_email)
  WHERE i.inviter_id = _user_id
  ORDER BY i.created_at DESC;
END;
$$;

-- Admin function: list a user's active tickets
CREATE OR REPLACE FUNCTION public.get_user_tickets_admin(_user_id uuid)
RETURNS TABLE(id uuid, artist text, price numeric, event_date date, city text, venue text, status text, created_at timestamptz)
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
  SELECT t.id, t.artist, t.price, t.event_date, t.city, t.venue, t.status, t.created_at
  FROM tickets t
  WHERE t.user_id = _user_id
    AND t.event_date >= CURRENT_DATE
  ORDER BY t.event_date ASC;
END;
$$;

-- Admin function: list a user's active wanted tickets
CREATE OR REPLACE FUNCTION public.get_user_wanted_tickets_admin(_user_id uuid)
RETURNS TABLE(id uuid, artist text, event_date date, city text, created_at timestamptz)
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
  SELECT w.id, w.artist, w.event_date, w.city, w.created_at
  FROM wanted_tickets w
  WHERE w.user_id = _user_id
    AND w.event_date >= CURRENT_DATE
  ORDER BY w.event_date ASC;
END;
$$;

-- Admin function: aggregated user stats for the main table
-- Returns one row per profile with all the counters needed in the admin Users tab
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  created_at timestamptz,
  friend_count integer,
  active_tickets integer,
  active_wanted integer,
  messages_sent integer,
  messages_received integer
)
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
    p.id,
    p.name,
    p.email,
    p.created_at,
    public.get_friend_count(p.id) AS friend_count,
    COALESCE((
      SELECT COUNT(*)::int FROM tickets t
      WHERE t.user_id = p.id AND t.event_date >= CURRENT_DATE
    ), 0) AS active_tickets,
    COALESCE((
      SELECT COUNT(*)::int FROM wanted_tickets w
      WHERE w.user_id = p.id AND w.event_date >= CURRENT_DATE
    ), 0) AS active_wanted,
    COALESCE((
      SELECT COUNT(*)::int FROM email_logs e
      WHERE e.user_id = p.id AND e.function_name = 'send-contact-email'
    ), 0) AS messages_sent,
    COALESCE((
      SELECT COUNT(*)::int FROM email_logs e
      WHERE LOWER(e.recipient_email) = LOWER(p.email) AND e.function_name = 'send-contact-email'
    ), 0) AS messages_received
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;