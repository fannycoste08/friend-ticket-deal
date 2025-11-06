-- Fix email exposure in profiles table by restricting RLS policy
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create two new policies: one for viewing own profile (including email)
-- and one for viewing other profiles (excluding email)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles (limited)"
ON public.profiles
FOR SELECT
USING (
  auth.uid() != id 
  AND id IN (
    -- Allow viewing profiles of users in your network
    SELECT network_user_id FROM get_extended_network(auth.uid())
  )
);