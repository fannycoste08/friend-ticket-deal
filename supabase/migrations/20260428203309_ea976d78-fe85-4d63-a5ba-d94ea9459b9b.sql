-- Revoke EXECUTE from anon on all SECURITY DEFINER functions except the one needed for the public invite flow
REVOKE EXECUTE ON FUNCTION public.cleanup_old_ip_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_expired_tickets() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_profiles_with_friend_count_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_friends_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_invitees_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_inviter_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_tickets_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_wanted_tickets_admin(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_extended_network(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_friend_suggestions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_mutual_friends(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_email() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_registered_invitee_emails(text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_friends_public(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_user_invitation_links(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_invitation_slug(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_friend_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- validate_invitation_link must remain callable by anon (used by /invite/:slug page before sign-in)
-- handle_new_user, create_friendship_on_user_registration, update_updated_at_column are triggers — not REST-callable