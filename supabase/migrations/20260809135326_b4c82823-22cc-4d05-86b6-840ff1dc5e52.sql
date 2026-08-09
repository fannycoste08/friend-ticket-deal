ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_unsubscribed boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.get_admin_user_stats();

CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
 RETURNS TABLE(id uuid, name text, email text, created_at timestamp with time zone, friend_count integer, active_tickets integer, active_wanted integer, messages_sent integer, messages_received integer, last_sign_in_at timestamp with time zone, has_password boolean, password_set_at timestamp with time zone, account_state text, newsletter_unsubscribed boolean)
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
    p.newsletter_unsubscribed
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_newsletter_unsubscribed(_user_id uuid, _value boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  UPDATE public.profiles
  SET newsletter_unsubscribed = COALESCE(_value, false)
  WHERE id = _user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_newsletter_unsubscribed(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_newsletter_unsubscribed(uuid, boolean) TO authenticated;