
-- Allow inviter to check which of their invitee_emails correspond to existing registered profiles,
-- without exposing arbitrary emails. Filters strictly to emails the caller has invited.
CREATE OR REPLACE FUNCTION public.get_registered_invitee_emails(_emails text[])
RETURNS TABLE(email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT LOWER(p.email)::text AS email
  FROM profiles p
  WHERE LOWER(p.email) = ANY (SELECT LOWER(unnest(_emails)))
    AND EXISTS (
      SELECT 1 FROM invitations i
      WHERE i.inviter_id = auth.uid()
        AND LOWER(i.invitee_email) = LOWER(p.email)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_registered_invitee_emails(text[]) TO authenticated;
