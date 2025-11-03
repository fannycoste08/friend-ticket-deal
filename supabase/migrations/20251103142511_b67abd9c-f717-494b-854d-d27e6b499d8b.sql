-- Fix 1: Remove plaintext password storage from invitations table
ALTER TABLE public.invitations DROP COLUMN IF EXISTS invitee_password;

-- Fix 2: Restrict profiles SELECT policy to owner-only (prevent email scraping)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a limited view for social features (name only, no email)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, name, created_at
FROM public.profiles;

-- Fix 3: Require authentication for invitation creation
DROP POLICY IF EXISTS "Anyone can insert invitations" ON public.invitations;

CREATE POLICY "Authenticated users can create invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = inviter_id);