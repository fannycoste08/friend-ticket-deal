REVOKE ALL ON FUNCTION public.get_user_wanted_tickets_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_wanted_tickets_admin(uuid) TO authenticated;