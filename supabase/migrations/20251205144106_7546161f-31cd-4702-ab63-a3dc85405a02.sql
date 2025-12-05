-- Drop the overly permissive "Public can view available tickets" policy
DROP POLICY IF EXISTS "Public can view available tickets" ON public.tickets;

-- Create a new policy that restricts visibility to extended network (matching wanted_tickets pattern)
CREATE POLICY "Users can view available tickets in their extended network"
ON public.tickets
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (
    status = 'available' AND
    user_id IN (
      SELECT network_user_id 
      FROM get_extended_network(auth.uid())
    )
  )
);