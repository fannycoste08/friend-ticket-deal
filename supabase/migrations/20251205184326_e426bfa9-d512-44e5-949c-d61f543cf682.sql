-- Drop the existing policy that exposes emails to extended network
DROP POLICY IF EXISTS "Users can view other profiles (limited)" ON public.profiles;

-- Create new policy that only allows viewing profiles of DIRECT friends (degree 1)
-- This prevents email exposure to friends-of-friends
CREATE POLICY "Users can view direct friends profiles only" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() <> id) 
  AND (
    id IN (
      SELECT network_user_id 
      FROM get_extended_network(auth.uid()) 
      WHERE degree = 1
    )
  )
);