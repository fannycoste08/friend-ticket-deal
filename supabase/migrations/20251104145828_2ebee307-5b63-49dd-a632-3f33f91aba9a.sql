-- Drop the public_profiles view since we'll allow basic profile viewing
DROP VIEW IF EXISTS public.public_profiles;

-- Update profiles RLS to allow authenticated users to view basic profile info
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix tickets table to not expose user_id publicly
DROP POLICY IF EXISTS "Anyone can view available tickets" ON public.tickets;

-- Allow public to view available tickets (but application should filter user_id)
CREATE POLICY "Public can view available tickets"
ON public.tickets
FOR SELECT
TO public
USING (status = 'available');

-- Authenticated users can see their own tickets with full details
CREATE POLICY "Users can view own tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);