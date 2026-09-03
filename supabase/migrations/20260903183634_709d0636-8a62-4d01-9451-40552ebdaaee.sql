ALTER TABLE public.wanted_tickets
ADD COLUMN quantity integer NOT NULL DEFAULT 1;

DROP FUNCTION IF EXISTS public.get_user_wanted_tickets_admin(uuid);

CREATE FUNCTION public.get_user_wanted_tickets_admin(_user_id uuid)
RETURNS TABLE (
  id uuid,
  artist text,
  city text,
  event_date date,
  created_at timestamptz,
  quantity integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, artist, city, event_date, created_at, quantity
  FROM public.wanted_tickets
  WHERE user_id = _user_id
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_wanted_tickets_admin(uuid) TO authenticated;