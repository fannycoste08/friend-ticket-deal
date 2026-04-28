-- Postgres grants EXECUTE to PUBLIC by default; we must revoke from PUBLIC too
REVOKE EXECUTE ON FUNCTION public.cleanup_old_ip_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_expired_tickets() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_profiles_with_friend_count_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_friends_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_invitees_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_inviter_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_tickets_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_wanted_tickets_admin(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_extended_network(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_friend_suggestions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_mutual_friends(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_registered_invitee_emails(text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_friends_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_user_invitation_links(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_invitation_slug(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_friend_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;

-- Re-grant to authenticated for the ones authenticated users actually call
GRANT EXECUTE ON FUNCTION public.get_admin_user_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_with_friend_count_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_friends_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_invitees_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_inviter_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tickets_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_wanted_tickets_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_extended_network(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_suggestions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_friends(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_registered_invitee_emails(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_friends_public(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_invitation_links(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invitation_slug(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;