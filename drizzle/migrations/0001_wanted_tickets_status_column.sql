ALTER TABLE public.wanted_tickets ADD COLUMN status text NOT NULL DEFAULT 'active';
COMMENT ON COLUMN public.wanted_tickets.status IS 'Estado de la búsqueda: active (buscando) o found (encontrada)';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wanted_tickets TO authenticated;
GRANT ALL ON public.wanted_tickets TO service_role;

DROP FUNCTION IF EXISTS public.get_all_wanted_tickets_admin();
CREATE FUNCTION public.get_all_wanted_tickets_admin()
 RETURNS TABLE(id uuid, user_id uuid, seeker_name text, seeker_email text, artist text, city text, event_date date, quantity integer, status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT w.id, w.user_id, p.name, p.email, w.artist, w.city, w.event_date, w.quantity, w.status, w.created_at
  FROM public.wanted_tickets w
  JOIN public.profiles p ON p.id = w.user_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY w.event_date ASC;
$function$;
GRANT EXECUTE ON FUNCTION public.get_all_wanted_tickets_admin() TO authenticated;

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
    COALESCE((SELECT COUNT(*)::int FROM wanted_tickets w WHERE w.user_id = p.id AND w.event_date >= CURRENT_DATE AND w.status <> 'found'), 0),
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
