CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
 RETURNS TABLE(id uuid, name text, email text, created_at timestamp with time zone, friend_count integer, active_tickets integer, active_wanted integer, messages_sent integer, messages_received integer, last_sign_in_at timestamp with time zone, has_password boolean, password_set_at timestamp with time zone, account_state text, newsletter_unsubscribed boolean, invite_origin text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  RETURN QUERY
  SELECT
    p.id, p.name, p.email, p.created_at,
    public.get_friend_count(p.id),
    COALESCE((SELECT COUNT(*)::int FROM tickets t WHERE t.user_id = p.id AND t.event_date >= CURRENT_DATE AND t.status = 'available'), 0),
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
    END,
    p.newsletter_unsubscribed,
    CASE
      WHEN p.password_set_at IS NOT NULL THEN 'registrado'
      ELSE (
        SELECT CASE
          WHEN i.status <> 'approved' THEN 'pendiente'
          WHEN (i.updated_at - i.created_at) <= INTERVAL '2 seconds' THEN 'B'
          ELSE 'A2'
        END
        FROM invitations i
        WHERE LOWER(i.invitee_email) = LOWER(p.email)
        ORDER BY (i.status = 'approved') DESC, i.created_at ASC
        LIMIT 1
      )
    END
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$function$;