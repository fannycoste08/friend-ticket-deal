CREATE OR REPLACE FUNCTION public.get_all_tickets_admin()
RETURNS TABLE(
  id uuid, user_id uuid, owner_name text, owner_email text,
  artist text, venue text, city text, event_date date,
  price numeric, quantity integer, ticket_type text, status text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.user_id, p.name, p.email, t.artist, t.venue, t.city, t.event_date,
         t.price, t.quantity, t.ticket_type, t.status, t.created_at
  FROM public.tickets t
  JOIN public.profiles p ON p.id = t.user_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY t.event_date ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_all_wanted_tickets_admin()
RETURNS TABLE(
  id uuid, user_id uuid, seeker_name text, seeker_email text,
  artist text, city text, event_date date, quantity integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.user_id, p.name, p.email, w.artist, w.city, w.event_date, w.quantity, w.created_at
  FROM public.wanted_tickets w
  JOIN public.profiles p ON p.id = w.user_id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY w.event_date ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_tickets_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_wanted_tickets_admin() TO authenticated;