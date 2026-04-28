-- Add slug column to invitation_links for human-readable URLs
ALTER TABLE public.invitation_links
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_invitation_links_slug ON public.invitation_links(slug);

-- Function to slugify a name: lowercase, strip accents, replace non-alnum with dashes
CREATE OR REPLACE FUNCTION public.slugify_name(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF _input IS NULL OR length(trim(_input)) = 0 THEN
    RETURN 'user';
  END IF;
  -- Remove accents using unaccent-like manual replacement
  v := lower(_input);
  v := translate(v,
    'áàäâãåāăąéèëêēĕėęěíìïîĩīĭįóòöôõøōŏőúùüûũūŭůűųýÿñçčćĉċđďḍḑḓḕḗḙḛḝḟḡḣḥḩḭḯḱḳḵḷḹḻḽḿṁṃṅṇṉṋṕṗṙṛṝṟṣṥṧṩṫṭṯṱẁẃẅẇẉẍẏẑẓẕβ',
    'aaaaaaaaaeeeeeeeeeiiiiiiiiooooooooouuuuuuuuuuyynccccddddddddeeeeefghhhhhiikkklllllmmmnnnnnpprrrrrssssttttwwwwwxyzzzb');
  v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');
  v := regexp_replace(v, '^-+|-+$', '', 'g');
  IF v = '' THEN
    v := 'user';
  END IF;
  RETURN v;
END;
$$;

-- Generate a unique slug for a user based on their profile name
CREATE OR REPLACE FUNCTION public.generate_invitation_slug(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  user_name text;
  i int := 2;
BEGIN
  IF auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT name INTO user_name FROM profiles WHERE id = _user_id;
  base_slug := public.slugify_name(COALESCE(user_name, 'user'));
  candidate := base_slug;

  WHILE EXISTS (SELECT 1 FROM invitation_links WHERE slug = candidate) LOOP
    candidate := base_slug || '-' || i::text;
    i := i + 1;
  END LOOP;

  RETURN candidate;
END;
$$;

-- Update validate_invitation_link to accept slug OR token
CREATE OR REPLACE FUNCTION public.validate_invitation_link(_token text)
RETURNS TABLE(is_valid boolean, is_expired boolean, is_revoked boolean, inviter_id uuid, inviter_name text)
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
  WHERE il.token = _token OR il.slug = _token
  ORDER BY il.created_at DESC
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