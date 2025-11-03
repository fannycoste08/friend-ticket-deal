-- Allow anonymous users to insert invitations (needed for registration flow)
DROP POLICY IF EXISTS "Users can insert invitations" ON public.invitations;

CREATE POLICY "Anyone can insert invitations"
ON public.invitations
FOR INSERT
TO public
WITH CHECK (true);

-- Keep the select policy for authenticated users only
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.invitations;

CREATE POLICY "Users can view their own invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (auth.uid() = inviter_id);