-- Tabla de links de invitación personales
CREATE TABLE public.invitation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  revoked BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_invitation_links_token ON public.invitation_links(token);
CREATE INDEX idx_invitation_links_user_id ON public.invitation_links(user_id);

ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario gestiona sus links
CREATE POLICY "Users can view their own invitation links"
ON public.invitation_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invitation links"
ON public.invitation_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitation links"
ON public.invitation_links FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invitation links"
ON public.invitation_links FOR DELETE
USING (auth.uid() = user_id);

-- Validación pública del link (sin auth) - devuelve nombre del invitador si es válido
CREATE OR REPLACE FUNCTION public.validate_invitation_link(_token TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  is_expired BOOLEAN,
  is_revoked BOOLEAN,
  inviter_id UUID,
  inviter_name TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link_record RECORD;
BEGIN
  SELECT il.user_id, il.expires_at, il.revoked, p.name
  INTO link_record
  FROM invitation_links il
  JOIN profiles p ON p.id = il.user_id
  WHERE il.token = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, false, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF link_record.revoked THEN
    RETURN QUERY SELECT false, false, true, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  IF link_record.expires_at < now() THEN
    RETURN QUERY SELECT false, true, false, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, false, false, link_record.user_id, link_record.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invitation_link(TEXT) TO anon, authenticated;

-- Revocar todos los links anteriores del usuario (al regenerar)
CREATE OR REPLACE FUNCTION public.revoke_user_invitation_links(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE invitation_links SET revoked = true WHERE user_id = _user_id AND revoked = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_user_invitation_links(UUID) TO authenticated;