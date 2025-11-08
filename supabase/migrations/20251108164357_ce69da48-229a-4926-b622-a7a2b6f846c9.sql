-- Remove the problematic policy that tries to access auth.users
DROP POLICY IF EXISTS "Invitees can view their own approved invitations" ON public.invitations;