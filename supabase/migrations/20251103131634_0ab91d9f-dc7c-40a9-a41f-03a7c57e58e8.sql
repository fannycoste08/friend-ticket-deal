-- Fix get_extended_network function to use 'approved' status and correct JOIN order
CREATE OR REPLACE FUNCTION public.get_extended_network(user_uuid uuid)
RETURNS TABLE(network_user_id uuid, degree integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH RECURSIVE network AS (
    -- Level 1: Direct connections (my godchildren and my godfather)
    SELECT 
      CASE 
        WHEN i.inviter_id = user_uuid THEN p.id
        WHEN p.id = user_uuid THEN i.inviter_id
      END as user_id,
      1 as level
    FROM invitations i
    JOIN profiles p ON p.email = i.invitee_email
    WHERE i.status = 'approved'
      AND (i.inviter_id = user_uuid OR p.id = user_uuid)
    
    UNION
    
    -- Level 2: Friends of friends
    SELECT 
      CASE 
        WHEN i2.inviter_id = n.user_id THEN p2.id
        WHEN p2.id = n.user_id THEN i2.inviter_id
      END as user_id,
      2 as level
    FROM network n
    CROSS JOIN profiles p2
    JOIN invitations i2 ON (i2.inviter_id = n.user_id OR p2.id = n.user_id) AND p2.email = i2.invitee_email
    WHERE n.level = 1
      AND i2.status = 'approved'
      AND CASE 
        WHEN i2.inviter_id = n.user_id THEN p2.id
        WHEN p2.id = n.user_id THEN i2.inviter_id
      END != user_uuid
  )
  SELECT DISTINCT user_id, level
  FROM network
  WHERE user_id IS NOT NULL;
END;
$function$;

-- Ensure trigger exists for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = COALESCE(EXCLUDED.name, profiles.name),
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();