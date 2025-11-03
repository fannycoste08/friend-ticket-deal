-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop and recreate public_profiles view with security
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.created_at
FROM public.profiles p
WHERE 
  -- Users can see their own profile
  auth.uid() = p.id
  OR
  -- Users can see profiles in their extended network
  EXISTS (
    SELECT 1
    FROM public.get_extended_network(auth.uid()) AS network
    WHERE network.network_user_id = p.id
  );

-- Update get_extended_network to verify caller permission
CREATE OR REPLACE FUNCTION public.get_extended_network(user_uuid UUID)
RETURNS TABLE(network_user_id UUID, degree INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: Only allow users to query their own network or if they're an admin
  IF user_uuid != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: You can only view your own network';
  END IF;

  RETURN QUERY
  WITH level_1 AS (
    -- Direct connections from invitations (godfather and godchildren)
    SELECT 
      CASE 
        WHEN i.inviter_id = user_uuid THEN p.id
        WHEN p.id = user_uuid THEN i.inviter_id
      END as user_id
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved'
      AND (i.inviter_id = user_uuid OR p.id = user_uuid)
    
    UNION
    
    -- Direct connections from accepted friendships (bidirectional)
    SELECT 
      CASE 
        WHEN f.user_id = user_uuid THEN f.friend_id
        WHEN f.friend_id = user_uuid THEN f.user_id
      END as user_id
    FROM friendships f
    WHERE f.status = 'accepted'
      AND (f.user_id = user_uuid OR f.friend_id = user_uuid)
  ),
  level_2 AS (
    -- Friends of friends via invitations
    SELECT DISTINCT
      CASE 
        WHEN i2.inviter_id = l1.user_id THEN p2.id
        WHEN p2.id = l1.user_id THEN i2.inviter_id
      END as user_id
    FROM level_1 l1
    CROSS JOIN profiles p2
    JOIN invitations i2 ON (i2.inviter_id = l1.user_id OR p2.id = l1.user_id) AND p2.email = i2.invitee_email
    WHERE i2.status = 'approved'
      AND CASE 
        WHEN i2.inviter_id = l1.user_id THEN p2.id
        WHEN p2.id = l1.user_id THEN i2.inviter_id
      END != user_uuid
      AND CASE 
        WHEN i2.inviter_id = l1.user_id THEN p2.id
        WHEN p2.id = l1.user_id THEN i2.inviter_id
      END NOT IN (SELECT user_id FROM level_1)
      
    UNION
    
    -- Friends of friends via friendships
    SELECT DISTINCT
      CASE 
        WHEN f2.user_id = l1.user_id THEN f2.friend_id
        WHEN f2.friend_id = l1.user_id THEN f2.user_id
      END as user_id
    FROM level_1 l1
    JOIN friendships f2 ON (f2.user_id = l1.user_id OR f2.friend_id = l1.user_id)
    WHERE f2.status = 'accepted'
      AND CASE 
        WHEN f2.user_id = l1.user_id THEN f2.friend_id
        WHEN f2.friend_id = l1.user_id THEN f2.user_id
      END != user_uuid
      AND CASE 
        WHEN f2.user_id = l1.user_id THEN f2.friend_id
        WHEN f2.friend_id = l1.user_id THEN f2.user_id
      END NOT IN (SELECT user_id FROM level_1)
  )
  SELECT user_id, 1 as degree FROM level_1 WHERE user_id IS NOT NULL
  UNION
  SELECT user_id, 2 as degree FROM level_2 WHERE user_id IS NOT NULL;
END;
$$;