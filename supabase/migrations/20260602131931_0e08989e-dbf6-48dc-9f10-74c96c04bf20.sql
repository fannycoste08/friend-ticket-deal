DROP FUNCTION IF EXISTS public.get_admin_user_stats();

CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
 RETURNS TABLE(id uuid, name text, email text, created_at timestamp with time zone, friend_count integer, active_tickets integer, active_wanted integer, messages_sent integer, messages_received integer, last_sign_in_at timestamp with time zone, has_password boolean)
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
    p.id,
    p.name,
    p.email,
    p.created_at,
    public.get_friend_count(p.id) AS friend_count,
    COALESCE((SELECT COUNT(*)::int FROM tickets t WHERE t.user_id = p.id AND t.event_date >= CURRENT_DATE), 0) AS active_tickets,
    COALESCE((SELECT COUNT(*)::int FROM wanted_tickets w WHERE w.user_id = p.id AND w.event_date >= CURRENT_DATE), 0) AS active_wanted,
    COALESCE((SELECT COUNT(*)::int FROM email_logs e WHERE e.user_id = p.id AND e.function_name = 'send-contact-email'), 0) AS messages_sent,
    COALESCE((SELECT COUNT(*)::int FROM email_logs e WHERE LOWER(e.recipient_email) = LOWER(p.email) AND e.function_name = 'send-contact-email'), 0) AS messages_received,
    (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id = p.id) AS last_sign_in_at,
    (SELECT u.encrypted_password IS NOT NULL FROM auth.users u WHERE u.id = p.id) AS has_password
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$function$;