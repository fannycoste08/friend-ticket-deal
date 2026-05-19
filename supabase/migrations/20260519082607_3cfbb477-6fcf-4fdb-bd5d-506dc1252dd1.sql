CREATE OR REPLACE FUNCTION public.get_activated_user_ids(_ids uuid[])
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.id
  FROM auth.users u
  WHERE u.id = ANY(_ids)
    AND u.encrypted_password IS NOT NULL;
$function$;