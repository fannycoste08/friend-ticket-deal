-- Create trigger function to automatically create friendship when user registers with approved invitation
CREATE OR REPLACE FUNCTION public.create_friendship_on_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if there's an approved invitation for this user's email
  SELECT i.inviter_id, i.invitee_email, i.status
  INTO invitation_record
  FROM invitations i
  WHERE LOWER(i.invitee_email) = LOWER(NEW.email)
    AND i.status = 'approved'
  LIMIT 1;

  -- If approved invitation exists, create friendship automatically
  IF FOUND THEN
    -- Create bidirectional friendship (user -> inviter)
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (NEW.id, invitation_record.inviter_id, 'accepted')
    ON CONFLICT DO NOTHING;

    RAISE LOG 'Auto-created friendship for user % with inviter %', NEW.id, invitation_record.inviter_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger that fires after a new profile is created
DROP TRIGGER IF EXISTS auto_create_friendship_on_registration ON public.profiles;
CREATE TRIGGER auto_create_friendship_on_registration
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_friendship_on_user_registration();