-- Restore the policy that allows users to see profiles of people in their extended network.
-- This was the missing policy that caused friend lists to appear empty.
CREATE POLICY "Network can view profile basics via view"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() <> id)
  AND (id IN (
    SELECT network_user_id FROM public.get_extended_network(auth.uid())
  ))
);