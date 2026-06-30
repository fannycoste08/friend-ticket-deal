DROP POLICY IF EXISTS "Users can view available tickets in their extended network" ON public.tickets;

CREATE POLICY "Users can view network tickets"
ON public.tickets
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (
    status IN ('available', 'sold')
    AND user_id IN (
      SELECT network_user_id FROM public.get_extended_network(auth.uid())
    )
  )
);