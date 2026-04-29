-- Create a public-safe view of profiles that excludes the email column
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, name, created_at, updated_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Drop the broad network SELECT policy that allowed reading all columns (including email)
DROP POLICY IF EXISTS "Network can view profile basics via view" ON public.profiles;

-- Now SELECT on profiles is restricted to the owner only.
-- Other users (including network) must read non-sensitive fields via profiles_public.
-- Edge functions using the service role key bypass RLS and can still read email server-side.