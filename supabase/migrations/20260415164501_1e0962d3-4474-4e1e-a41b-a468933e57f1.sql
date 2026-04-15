
DROP POLICY IF EXISTS "Users can view direct friends profiles only" ON public.profiles;

CREATE POLICY "Users can view extended network profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  (auth.uid() <> id) AND (
    id IN (
      SELECT network_user_id
      FROM get_extended_network(auth.uid())
    )
  )
);
