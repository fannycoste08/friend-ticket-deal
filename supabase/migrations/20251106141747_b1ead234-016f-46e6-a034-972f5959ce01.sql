-- Update trigger function to create friendship only with the specific godparent chosen during registration
CREATE OR REPLACE FUNCTION public.create_friendship_on_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record RECORD;
  chosen_inviter_email TEXT;
BEGIN
  -- Get the inviter email that the user chose during registration from user metadata
  chosen_inviter_email := NEW.email; -- This will be replaced by the actual inviter email from auth.users metadata
  
  -- We need to get it from auth.users table
  SELECT raw_user_meta_data->>'inviter_email' INTO chosen_inviter_email
  FROM auth.users
  WHERE id = NEW.id;

  -- If no specific inviter was chosen, don't create any friendship
  IF chosen_inviter_email IS NULL OR chosen_inviter_email = '' THEN
    RAISE LOG 'No specific inviter chosen for user %', NEW.id;
    RETURN NEW;
  END IF;

  -- Find the approved invitation from the SPECIFIC godparent the user chose
  SELECT i.inviter_id, i.invitee_email, i.status
  INTO invitation_record
  FROM invitations i
  JOIN profiles p ON p.id = i.inviter_id
  WHERE LOWER(i.invitee_email) = LOWER(NEW.email)
    AND LOWER(p.email) = LOWER(chosen_inviter_email)
    AND i.status = 'approved'
  LIMIT 1;

  -- If approved invitation exists from the chosen godparent, create friendship automatically
  IF FOUND THEN
    -- Create bidirectional friendship (user -> inviter)
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (NEW.id, invitation_record.inviter_id, 'accepted')
    ON CONFLICT DO NOTHING;

    RAISE LOG 'Auto-created friendship for user % with chosen inviter % (email: %)', 
      NEW.id, invitation_record.inviter_id, chosen_inviter_email;
  ELSE
    RAISE LOG 'No approved invitation found from chosen inviter % for user %', 
      chosen_inviter_email, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;