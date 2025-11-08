-- Add policy for invitees to view their approved invitations
-- This allows users to see invitations where their email matches the invitee_email
-- Only for approved invitations to prevent seeing pending requests
CREATE POLICY "Users can view approved invitations for their email"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  status = 'approved' 
  AND invitee_email ILIKE (
    SELECT email 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);