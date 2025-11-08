-- Allow invitees to view their own approved invitations
-- This is needed so users can verify their invitation when creating their password
CREATE POLICY "Invitees can view their own approved invitations"
ON public.invitations
FOR SELECT
USING (
  status = 'approved' 
  AND invitee_email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
);